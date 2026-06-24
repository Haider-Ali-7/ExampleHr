"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { SyncIndicator } from "@/components/leave/SyncIndicator";
import { EmployeeTable } from "@/components/leave/EmployeeTable";
import { SimulationPanel } from "@/components/leave/SimulationPanel";
import { useAdminLeave } from "@/hooks/useAdminLeave";
import { useSimulation } from "@/hooks/useSimulation";
import { useAuthStore } from "@/store/authStore";

function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const adminName = user?.name ?? "Admin";

  const {
    employees,
    isLoading,
    lastSync,
    sseError,
    staleCells,
    updateBalance,
  } = useAdminLeave();

  const simulation = useSimulation();

  const staleCount = staleCells.size;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Employee Leave Balances
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Admin Dashboard &mdash; {adminName}
          </p>
        </div>

        <div className="flex items-center gap-3 sm:mt-1 flex-wrap">
          {staleCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {staleCount} cell{staleCount !== 1 ? "s" : ""} updated by HCM
            </span>
          )}
          <SyncIndicator
            lastSync={lastSync}
            hasError={!!sseError}
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-4 flex items-start gap-3">
        <svg
          aria-hidden="true"
          className="w-4 h-4 mt-0.5 text-zinc-400 dark:text-zinc-500 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Click any balance cell to edit it directly. Changes are pushed to the HCM system immediately.
          Amber dots indicate cells updated by an external HCM sync since you last viewed them.
        </p>
      </div>

      <EmployeeTable
        employees={employees}
        isLoading={isLoading}
        staleCells={staleCells}
        onUpdateBalance={updateBalance}
      />

      <SimulationPanel
        status={simulation.status}
        isLoading={simulation.isLoading}
        isChecking={simulation.isChecking}
        lastApplied={simulation.lastApplied}
        onRunCheck={simulation.runCheck}
        onApplyAnniversary={simulation.applyAnniversaryCredit}
        isApplyingAnniversary={simulation.isApplyingAnniversary}
        onApplyYearlyReset={simulation.applyYearlyReset}
        isApplyingYearlyReset={simulation.isApplyingYearlyReset}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <AuthGuard requiredRole="admin">
      <AdminDashboard />
    </AuthGuard>
  );
}
