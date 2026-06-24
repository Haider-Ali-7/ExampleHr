"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HCMBalance, LeaveRequest } from "@/lib/types";
import { useLeaveSSE } from "@/hooks/useLeaveSSE";
import { queryKeys } from "@/lib/queryKeys";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface DecideRequestInput {
  id: string;
  decision: {
    status: "approved" | "rejected";
    managerNote?: string;
    decidedBy: string;
  };
}

interface UseManagerLeaveReturn {
  pendingRequests: LeaveRequest[];
  decidedRequests: LeaveRequest[];
  balances: HCMBalance[];
  isLoadingRequests: boolean;
  isLoadingBalances: boolean;
  sseConnected: boolean;
  lastSync: string | null;
  sseError: string | null;
  decideRequest: (
    id: string,
    decision: {
      status: "approved" | "rejected";
      managerNote?: string;
      decidedBy: string;
    }
  ) => Promise<void>;
  isDeciding: Record<string, boolean>;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  getBalanceForRequest: (req: LeaveRequest) => HCMBalance | null;
}

function makeToast(message: string, type: ToastMessage["type"]): ToastMessage {
  return { id: crypto.randomUUID(), message, type };
}

async function fetchAllRequests(): Promise<LeaveRequest[]> {
  const res = await fetch("/api/leave/requests");
  if (!res.ok) throw new Error("Failed to fetch requests");
  const data = (await res.json()) as { requests: LeaveRequest[] };
  return data.requests;
}

async function fetchAllBalances(): Promise<HCMBalance[]> {
  const res = await fetch("/api/leave/balances");
  if (!res.ok) throw new Error("Failed to fetch balances");
  const data = (await res.json()) as { balances: HCMBalance[] };
  return data.balances;
}

async function decideRequestApi(input: DecideRequestInput): Promise<LeaveRequest> {
  const res = await fetch(`/api/leave/requests/${input.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.decision),
  });
  if (!res.ok) {
    const errBody = (await res.json()) as { error?: string };
    throw new Error(errBody.error ?? "Failed to process decision");
  }
  const data = (await res.json()) as { request: LeaveRequest };
  return data.request;
}

export function useManagerLeave(): UseManagerLeaveReturn {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const { isConnected: sseConnected, lastEvent, lastSync, error: sseError } = useLeaveSSE();

  const requestsQuery = useQuery({
    queryKey: queryKeys.requests.all,
    queryFn: fetchAllRequests,
    staleTime: 30000,
  });

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances.all,
    queryFn: fetchAllBalances,
    staleTime: 30000,
  });

  const addToast = useCallback((message: string, type: ToastMessage["type"]) => {
    setToasts(prev => [...prev, makeToast(message, type)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    const { type, payload } = lastEvent;

    if (type === "request_created") {
      const req = payload as LeaveRequest;
      queryClient.setQueryData<LeaveRequest[]>(queryKeys.requests.all, old => {
        if (!old) return [req];
        const alreadyExists = old.some(r => r.id === req.id);
        return alreadyExists ? old : [req, ...old];
      });
      addToast(`New leave request from ${req.employeeName}.`, "info");
    }

    if (type === "balance_updated" || type === "hcm_sync") {
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
      addToast("Leave balances updated by HCM system.", "info");
    }

    if (type === "anniversary_credited") {
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
      addToast("Anniversary bonus applied to employee balance.", "info");
    }

    if (type === "yearly_reset_applied") {
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
      addToast("Yearly balance bonus applied to all employees.", "info");
    }

    if (type === "request_decided") {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
    }
  }, [lastEvent, queryClient, addToast]);

  const decideMutation = useMutation({
    mutationFn: decideRequestApi,

    onMutate: async ({ id, decision }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.requests.all });

      const previous = queryClient.getQueryData<LeaveRequest[]>(queryKeys.requests.all);

      queryClient.setQueryData<LeaveRequest[]>(queryKeys.requests.all, old => {
        if (!old) return old;
        return old.map(r => {
          if (r.id !== id) return r;
          return {
            ...r,
            status: decision.status,
            decidedAt: new Date().toISOString(),
            decidedBy: decision.decidedBy,
            ...(decision.managerNote !== undefined ? { managerNote: decision.managerNote } : {}),
          };
        });
      });

      return { previous };
    },

    onError: (_err, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.requests.all, context.previous);
      }
    },

    onSuccess: (updated, { decision }) => {
      queryClient.setQueryData<LeaveRequest[]>(queryKeys.requests.all, old =>
        (old ?? []).map(r => r.id === updated.id ? updated : r)
      );
      const verb = decision.status === "approved" ? "approved" : "rejected";
      addToast(`Leave request ${verb} successfully.`, "success");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
    },
  });

  const decideRequest = useCallback(
    async (
      id: string,
      decision: {
        status: "approved" | "rejected";
        managerNote?: string;
        decidedBy: string;
      }
    ) => {
      try {
        await decideMutation.mutateAsync({ id, decision });
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        addToast(message, "error");
      }
    },
    [decideMutation, addToast]
  );

  const allRequests = requestsQuery.data ?? [];
  const pendingRequests = allRequests.filter(r => r.status === "pending");
  const decidedRequests = allRequests.filter(r => r.status !== "pending");

  const isDeciding: Record<string, boolean> = {};
  if (decideMutation.isPending && decideMutation.variables) {
    isDeciding[decideMutation.variables.id] = true;
  }

  const getBalanceForRequest = useCallback(
    (req: LeaveRequest): HCMBalance | null => {
      const balances = balancesQuery.data ?? [];
      return (
        balances.find(
          b =>
            b.employeeId === req.employeeId &&
            b.location === req.location &&
            b.leaveType === req.leaveType
        ) ?? null
      );
    },
    [balancesQuery.data]
  );

  return {
    pendingRequests,
    decidedRequests,
    balances: balancesQuery.data ?? [],
    isLoadingRequests: requestsQuery.isLoading,
    isLoadingBalances: balancesQuery.isLoading,
    sseConnected,
    lastSync,
    sseError,
    decideRequest,
    isDeciding,
    toasts,
    dismissToast,
    getBalanceForRequest,
  };
}
