"use client";

import { useState, useCallback } from "react";
import type { LeaveType } from "@/lib/types";

interface UseHCMSimulatorReturn {
  simulateBalanceUpdate: (
    employeeId: string,
    location: string,
    leaveType: LeaveType,
    newBalance: number
  ) => Promise<void>;
  isSimulating: boolean;
  lastSimulatedAt: string | null;
}

export function useHCMSimulator(): UseHCMSimulatorReturn {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastSimulatedAt, setLastSimulatedAt] = useState<string | null>(null);

  const simulateBalanceUpdate = useCallback(
    async (
      employeeId: string,
      location: string,
      leaveType: LeaveType,
      newBalance: number
    ) => {
      setIsSimulating(true);
      try {
        const res = await fetch("/api/leave/hcm/balances", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employeeId, location, leaveType, balance: newBalance }),
        });

        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to simulate balance update");
        }

        setLastSimulatedAt(new Date().toISOString());
      } finally {
        setIsSimulating(false);
      }
    },
    []
  );

  return { simulateBalanceUpdate, isSimulating, lastSimulatedAt };
}
