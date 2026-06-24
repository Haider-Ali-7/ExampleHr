import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { SimulationStatus, SimulationEvent } from '@/lib/types';

async function fetchSimulationStatus(): Promise<SimulationStatus> {
  const res = await fetch('/api/leave/simulation/status');
  if (!res.ok) throw new Error('Failed to fetch simulation status');
  return res.json();
}

async function runSimulationCheck(): Promise<{ applied: SimulationEvent[] }> {
  const res = await fetch('/api/leave/simulation/check', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run simulation check');
  return res.json();
}

async function applyAnniversaryCredit(employeeId: string): Promise<{ applied: SimulationEvent }> {
  const res = await fetch('/api/leave/simulation/anniversary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
  if (!res.ok) throw new Error('Failed to apply anniversary credit');
  return res.json();
}

async function applyYearlyReset(): Promise<{ applied: SimulationEvent[] }> {
  const res = await fetch('/api/leave/simulation/yearly-reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to apply yearly reset');
  return res.json();
}

export function useSimulation() {
  const queryClient = useQueryClient();
  const hasChecked = useRef(false);

  const statusQuery = useQuery({
    queryKey: queryKeys.simulation.status,
    queryFn: fetchSimulationStatus,
    staleTime: 60_000,
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.simulation.status });
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.employees });
    queryClient.invalidateQueries({ queryKey: queryKeys.balances.all });
  }, [queryClient]);

  const checkMutation = useMutation({
    mutationFn: runSimulationCheck,
    onSuccess: (data) => {
      if (data.applied.length > 0) {
        invalidateAll();
      }
    },
  });

  const anniversaryMutation = useMutation({
    mutationFn: applyAnniversaryCredit,
    onSuccess: () => {
      invalidateAll();
    },
  });

  const yearlyResetMutation = useMutation({
    mutationFn: applyYearlyReset,
    onSuccess: () => {
      invalidateAll();
    },
  });

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isChecking: checkMutation.isPending,
    lastApplied: checkMutation.data?.applied ?? [],
    runCheck: () => checkMutation.mutate(),
    applyAnniversaryCredit: (employeeId: string) => anniversaryMutation.mutate(employeeId),
    isApplyingAnniversary: anniversaryMutation.isPending,
    applyYearlyReset: () => yearlyResetMutation.mutate(),
    isApplyingYearlyReset: yearlyResetMutation.isPending,
  };
}
