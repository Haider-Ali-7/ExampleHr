"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HCMBalance, LeaveType } from "@/lib/types";
import { useLeaveSSE } from "@/hooks/useLeaveSSE";
import { queryKeys } from "@/lib/queryKeys";
import { staleKey } from "@/lib/staleKey";
import type { EmployeeWithBalances } from "@/app/api/admin/employees/route";

interface UseAdminLeaveReturn {
  employees: EmployeeWithBalances[];
  isLoading: boolean;
  sseConnected: boolean;
  lastSync: string | null;
  sseError: string | null;
  staleCells: Set<string>;
  updateBalance: (
    employeeId: string,
    location: string,
    leaveType: LeaveType,
    newBalance: number
  ) => Promise<void>;
  clearStale: (employeeId: string, location: string, leaveType: LeaveType) => void;
}

async function fetchEmployees(): Promise<EmployeeWithBalances[]> {
  const res = await fetch("/api/admin/employees");
  if (!res.ok) throw new Error("Failed to fetch employees");
  const data = (await res.json()) as { employees: EmployeeWithBalances[] };
  return data.employees;
}

interface UpdateBalanceInput {
  employeeId: string;
  location: string;
  leaveType: LeaveType;
  newBalance: number;
}

async function updateBalanceApi(input: UpdateBalanceInput): Promise<HCMBalance> {
  const res = await fetch("/api/leave/hcm/balances", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: input.employeeId,
      location: input.location,
      leaveType: input.leaveType,
      balance: input.newBalance,
    }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? "Failed to update balance");
  }
  const body = (await res.json()) as { balance: HCMBalance };
  return body.balance;
}

export function useAdminLeave(): UseAdminLeaveReturn {
  const queryClient = useQueryClient();
  const [staleCells, setStaleCells] = useState<Set<string>>(new Set());

  const { isConnected: sseConnected, lastEvent, lastSync, error: sseError } = useLeaveSSE();

  const employeesQuery = useQuery({
    queryKey: queryKeys.admin.employees,
    queryFn: fetchEmployees,
    staleTime: 30000,
  });

  const addStaleCell = useCallback((employeeId: string, location: string, leaveType: LeaveType) => {
    setStaleCells(prev => new Set(prev).add(staleKey(employeeId, location, leaveType)));
  }, []);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "hcm_sync" || lastEvent.type === "balance_updated") {
      const updated = lastEvent.payload as HCMBalance;

      queryClient.setQueryData<EmployeeWithBalances[]>(queryKeys.admin.employees, prev => {
        if (!prev) return prev;
        return prev.map(emp => {
          if (emp.id !== updated.employeeId) return emp;

          const locationExists = emp.balances.some(b => b.location === updated.location);

          const newBalances = locationExists
            ? emp.balances.map(b => {
                if (b.location !== updated.location) return b;
                return { ...b, [updated.leaveType]: updated.balance };
              })
            : [
                ...emp.balances,
                {
                  location: updated.location,
                  annual: updated.leaveType === "annual" ? updated.balance : null,
                  sick: updated.leaveType === "sick" ? updated.balance : null,
                  personal: updated.leaveType === "personal" ? updated.balance : null,
                },
              ];

          return { ...emp, balances: newBalances };
        });
      });

      addStaleCell(updated.employeeId, updated.location, updated.leaveType);
    }
  }, [lastEvent, queryClient, addStaleCell]);

  const updateBalanceMutation = useMutation({
    mutationFn: updateBalanceApi,

    onSuccess: (updated, input) => {
      queryClient.setQueryData<EmployeeWithBalances[]>(queryKeys.admin.employees, prev => {
        if (!prev) return prev;
        return prev.map(emp => {
          if (emp.id !== input.employeeId) return emp;
          return {
            ...emp,
            balances: emp.balances.map(b => {
              if (b.location !== input.location) return b;
              return { ...b, [input.leaveType]: updated.balance };
            }),
          };
        });
      });

      setStaleCells(prev => {
        const next = new Set(prev);
        next.delete(staleKey(input.employeeId, input.location, input.leaveType));
        return next;
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.employees });
    },
  });

  const updateBalance = useCallback(
    async (employeeId: string, location: string, leaveType: LeaveType, newBalance: number) => {
      await updateBalanceMutation.mutateAsync({ employeeId, location, leaveType, newBalance });
    },
    [updateBalanceMutation]
  );

  const clearStale = useCallback(
    (employeeId: string, location: string, leaveType: LeaveType) => {
      setStaleCells(prev => {
        const next = new Set(prev);
        next.delete(staleKey(employeeId, location, leaveType));
        return next;
      });
    },
    []
  );

  return {
    employees: employeesQuery.data ?? [],
    isLoading: employeesQuery.isLoading,
    sseConnected,
    lastSync,
    sseError,
    staleCells,
    updateBalance,
    clearStale,
  };
}
