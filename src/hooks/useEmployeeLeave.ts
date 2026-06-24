'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeaveSSE } from '@/hooks/useLeaveSSE';
import { queryKeys } from '@/lib/queryKeys';
import type { HCMBalance, LeaveRequest, LeaveType, Location } from '@/lib/types';

interface OptimisticRequest extends LeaveRequest {
  optimisticStatus?: 'pending' | 'rolled-back';
  isOptimistic?: boolean;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface SubmitRequestData {
  location: Location;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

interface UseEmployeeLeaveReturn {
  balances: HCMBalance[];
  requests: OptimisticRequest[];
  toasts: ToastMessage[];
  isLoadingBalances: boolean;
  isFetchingBalances: boolean;
  isLoadingRequests: boolean;
  isBalancesStale: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  sseConnected: boolean;
  lastSync: string | null;
  sseError: string | null;
  submitRequest: (data: SubmitRequestData) => Promise<void>;
  dismissToast: (id: string) => void;
  refreshBalances: () => Promise<void>;
  submitCount: number;
}

function makeToast(message: string, type: ToastMessage['type']): ToastMessage {
  return { id: crypto.randomUUID(), message, type };
}

async function fetchBalances(employeeId: string): Promise<HCMBalance[]> {
  const res = await fetch(`/api/leave/balances?employeeId=${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch balances');
  const data = (await res.json()) as { balances: HCMBalance[] };
  return data.balances;
}

async function fetchRequests(employeeId: string): Promise<OptimisticRequest[]> {
  const res = await fetch(`/api/leave/requests?employeeId=${employeeId}`);
  if (!res.ok) throw new Error('Failed to fetch requests');
  const data = (await res.json()) as { requests: LeaveRequest[] };
  return data.requests;
}

async function submitRequestApi(body: {
  employeeId: string;
  employeeName: string;
  location: Location;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}): Promise<LeaveRequest> {
  const res = await fetch('/api/leave/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errBody = (await res.json()) as { error?: string };
    throw new Error(errBody.error ?? 'Failed to submit leave request');
  }
  const data = (await res.json()) as { request: LeaveRequest };
  return data.request;
}

export function useEmployeeLeave(employeeId: string, employeeName: string): UseEmployeeLeaveReturn {
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isBalancesStale, setIsBalancesStale] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitCountRef = useRef(0);
  const [submitCount, setSubmitCount] = useState(0);

  const { isConnected: sseConnected, lastEvent, lastSync, error: sseError } = useLeaveSSE();

  const balancesQuery = useQuery({
    queryKey: queryKeys.balances.byEmployee(employeeId),
    queryFn: () => fetchBalances(employeeId),
    staleTime: 30000,
  });

  const requestsQuery = useQuery({
    queryKey: queryKeys.requests.byEmployee(employeeId),
    queryFn: () => fetchRequests(employeeId),
    staleTime: 30000,
  });

  const addToast = useCallback((message: string, type: ToastMessage['type']) => {
    setToasts(prev => [...prev, makeToast(message, type)]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    const { type, payload } = lastEvent;

    if (type === 'balance_updated' || type === 'hcm_sync') {
      const p = payload as { employeeId?: string };
      if (!p.employeeId || p.employeeId === employeeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) });
        setIsBalancesStale(false);
        addToast('Your leave balance has been updated.', 'info');
      }
    }

    if (type === 'anniversary_credited') {
      const p = payload as { employeeId?: string };
      if (!p.employeeId || p.employeeId === employeeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) });
        setIsBalancesStale(false);
        addToast('Anniversary bonus added to your balance!', 'success');
      }
    }

    if (type === 'yearly_reset_applied') {
      const p = payload as { employeeId?: string };
      if (!p.employeeId || p.employeeId === employeeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) });
        setIsBalancesStale(false);
        addToast('Yearly balance bonus added!', 'success');
      }
    }

    if (type === 'request_decided') {
      const p = payload as LeaveRequest;
      if (p.employeeId === employeeId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.requests.byEmployee(employeeId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) });

        if (p.status === 'approved') {
          addToast('Your leave request was approved.', 'success');
        } else if (p.status === 'rejected') {
          const note = p.managerNote ? ` Note: ${p.managerNote}` : '';
          addToast(`Your leave request was rejected.${note}`, 'error');
        }
      }
    }
  }, [lastEvent, employeeId, queryClient, addToast]);

  const submitMutation = useMutation({
    mutationFn: (data: SubmitRequestData) =>
      submitRequestApi({ employeeId, employeeName, ...data }),

    onMutate: async (data) => {
      // Cancel any in-flight fetches for both caches we're about to mutate so
      // they don't overwrite our optimistic writes.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.requests.byEmployee(employeeId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) }),
      ]);

      const previousRequests = queryClient.getQueryData<OptimisticRequest[]>(
        queryKeys.requests.byEmployee(employeeId)
      );
      const previousBalances = queryClient.getQueryData<HCMBalance[]>(
        queryKeys.balances.byEmployee(employeeId)
      );

      const optimisticId = `optimistic_${Date.now()}`;

      // Optimistically prepend the new pending request to the list.
      const optimistic: OptimisticRequest = {
        id: optimisticId,
        employeeId,
        employeeName,
        location: data.location,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        days: data.days,
        reason: data.reason,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        optimisticStatus: 'pending',
        isOptimistic: true,
      };

      queryClient.setQueryData<OptimisticRequest[]>(
        queryKeys.requests.byEmployee(employeeId),
        old => [optimistic, ...(old ?? [])]
      );

      // Optimistically deduct the requested days from the matching balance so
      // the displayed balance immediately reflects that these days are spoken
      // for. Note: the server does NOT deduct on submission — it deducts only
      // on approval. The optimistic value here is intentionally a display
      // convenience; onSettled always refetches the real server value.
      queryClient.setQueryData<HCMBalance[]>(
        queryKeys.balances.byEmployee(employeeId),
        old => {
          if (!old) return old;
          return old.map(b => {
            if (
              b.employeeId === employeeId &&
              b.location === data.location &&
              b.leaveType === data.leaveType
            ) {
              return { ...b, balance: Math.max(0, b.balance - data.days) };
            }
            return b;
          });
        }
      );

      return { previousRequests, previousBalances, optimisticId };
    },

    onError: (err, _data, context) => {
      // Roll both caches back to the snapshots taken in onMutate.
      if (context?.previousRequests !== undefined) {
        queryClient.setQueryData(
          queryKeys.requests.byEmployee(employeeId),
          context.previousRequests
        );
      }
      if (context?.previousBalances !== undefined) {
        queryClient.setQueryData(
          queryKeys.balances.byEmployee(employeeId),
          context.previousBalances
        );
      }

      const message = err instanceof Error ? err.message : 'An unexpected error occurred';

      // If rejected due to insufficient balance, refetch the real balance so
      // displayed value converges to truth rather than staying optimistic.
      if (message.includes('Insufficient')) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.balances.byEmployee(employeeId),
        });
      }

      setSubmitError(message);
      addToast(message, 'error');
    },

    onSuccess: (created, _data, context) => {
      setSubmitError(null);

      // Replace the optimistic placeholder with the confirmed server record.
      queryClient.setQueryData<OptimisticRequest[]>(
        queryKeys.requests.byEmployee(employeeId),
        old => (old ?? []).map(r => r.id === context.optimisticId ? { ...created } : r)
      );

      // Signal the form to reset. Using a ref + state pair keeps the counter
      // stable across re-renders without stale-closure risk.
      submitCountRef.current += 1;
      setSubmitCount(submitCountRef.current);

      addToast('Leave request submitted.', 'success');
    },

    onSettled: () => {
      // Refetch requests to reconcile optimistic state with server. Balance is
      // intentionally NOT refetched here — the optimistic deduction persists
      // until an SSE event (hcm_sync, balance_updated, or request_decided)
      // arrives with the real value. This gives immediate visual feedback.
      queryClient.invalidateQueries({ queryKey: queryKeys.requests.byEmployee(employeeId) });
    },
  });

  const submitRequest = useCallback(
    async (data: SubmitRequestData) => {
      await submitMutation.mutateAsync(data);
    },
    [submitMutation]
  );

  const refreshBalances = useCallback(async () => {
    setIsBalancesStale(false);
    await queryClient.invalidateQueries({ queryKey: queryKeys.balances.byEmployee(employeeId) });
  }, [queryClient, employeeId]);

  return {
    balances: balancesQuery.data ?? [],
    requests: requestsQuery.data ?? [],
    toasts,
    isLoadingBalances: balancesQuery.isLoading,
    isFetchingBalances: balancesQuery.isFetching,
    isLoadingRequests: requestsQuery.isLoading,
    isBalancesStale,
    isSubmitting: submitMutation.isPending,
    submitError,
    sseConnected,
    lastSync,
    sseError,
    submitRequest,
    dismissToast,
    refreshBalances,
    submitCount,
  };
}
