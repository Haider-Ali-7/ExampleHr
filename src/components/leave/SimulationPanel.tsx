"use client";

import type { SimulationStatus, SimulationEvent, EmployeeConfig } from "@/lib/types";

interface SimulationPanelProps {
  status: SimulationStatus | undefined;
  isLoading: boolean;
  isChecking: boolean;
  lastApplied: SimulationEvent[];
  onRunCheck: () => void;
  onApplyAnniversary: (employeeId: string) => void;
  isApplyingAnniversary: boolean;
  onApplyYearlyReset: () => void;
  isApplyingYearlyReset: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNextAnniversary(hireDate: string): { date: Date; daysUntil: number } {
  const today = new Date();
  const hire = new Date(hireDate);
  let anniversary = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());
  if (anniversary < today) {
    anniversary = new Date(today.getFullYear() + 1, hire.getMonth(), hire.getDate());
  }
  const daysUntil = Math.ceil((anniversary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { date: anniversary, daysUntil };
}

function getNextResetDate(resetType: "calendar" | "fiscal", fiscalMonthDay?: { month: number; day: number }): { date: Date; daysUntil: number } {
  const today = new Date();
  let resetDate: Date;

  if (resetType === "calendar") {
    resetDate = new Date(today.getFullYear() + 1, 0, 1);
  } else {
    const { month, day } = fiscalMonthDay ?? { month: 1, day: 1 };
    resetDate = new Date(today.getFullYear(), month - 1, day);
    if (resetDate <= today) {
      resetDate = new Date(today.getFullYear() + 1, month - 1, day);
    }
  }

  const daysUntil = Math.ceil((resetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return { date: resetDate, daysUntil };
}

function AnniversaryCard({
  config,
  employeeName,
  onApply,
  isApplying,
}: {
  config: EmployeeConfig;
  employeeName: string;
  onApply: () => void;
  isApplying: boolean;
}) {
  const { date, daysUntil } = getNextAnniversary(config.hireDate);
  const totalCredits = config.anniversaryCredits.reduce((sum, c) => sum + c.creditsPerYear, 0);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{employeeName}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Hired {formatDate(config.hireDate)}
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          daysUntil <= 30
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
        }`}>
          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Next:</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatDate(date.toISOString())}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">+{totalCredits} days</span>
        </div>
        <button
          onClick={onApply}
          disabled={isApplying}
          className="inline-flex items-center gap-1 rounded-md bg-violet-100 dark:bg-violet-900/40 px-2 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/50 disabled:opacity-50 transition-colors"
          title="Manually apply anniversary credit"
        >
          {isApplying ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          )}
          Apply Now
        </button>
      </div>
    </div>
  );
}

function RecentEventRow({ event }: { event: SimulationEvent }) {
  const totalDelta = event.changes.reduce((sum, c) => sum + c.delta, 0);
  const isPositive = totalDelta >= 0;

  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        event.type === "anniversary_credit"
          ? "bg-violet-500"
          : "bg-blue-500"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {event.employeeName}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {event.type === "anniversary_credit" ? "Anniversary credit" : "Yearly bonus"}
          {" • "}
          {event.appliedAt && formatDate(event.appliedAt)}
        </p>
      </div>
      <span className={`text-sm font-medium ${
        isPositive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}>
        {isPositive ? "+" : ""}{totalDelta} days
      </span>
    </div>
  );
}

export function SimulationPanel({
  status,
  isLoading,
  isChecking,
  lastApplied,
  onRunCheck,
  onApplyAnniversary,
  isApplyingAnniversary,
  onApplyYearlyReset,
  isApplyingYearlyReset,
}: SimulationPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-6">
        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading simulation data...</span>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const employeeNames: Record<string, string> = {
    emp_001: "John Smith",
    emp_002: "Sarah Johnson",
    emp_003: "Marcus Chen",
  };

  const { date: nextResetDate, daysUntil: resetDaysUntil } = getNextResetDate(
    status.yearlyReset.resetType,
    status.yearlyReset.fiscalMonthDay
  );

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Leave Balance Simulation
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Anniversary credits and yearly resets
          </p>
        </div>
        <button
          onClick={onRunCheck}
          disabled={isChecking}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {isChecking ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking...
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Run Check
            </>
          )}
        </button>
      </div>

      {lastApplied.length > 0 && (
        <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            <span className="font-medium">{lastApplied.length} event{lastApplied.length !== 1 ? "s" : ""}</span> applied just now
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-700">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Yearly Balance Bonus</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {status.yearlyReset.resetType === "calendar" ? "Calendar year" : "Fiscal year"} bonus
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Next bonus</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(nextResetDate.toISOString())}
                <span className="ml-1.5 text-zinc-500">({resetDaysUntil} days)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Annual leave</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {status.yearlyReset.annualReset} days
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Sick leave</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {status.yearlyReset.sickReset} days
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Personal leave</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {status.yearlyReset.personalReset} days
              </span>
            </div>
            {status.yearlyReset.lastResetDate && (
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Last bonus: {formatDate(status.yearlyReset.lastResetDate)}
                </p>
              </div>
            )}
            <div className="pt-3">
              <button
                onClick={onApplyYearlyReset}
                disabled={isApplyingYearlyReset}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50 transition-colors"
              >
                {isApplyingYearlyReset ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Applying...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Apply Yearly Bonus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Anniversary Credits</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Per employee hire date
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {status.employeeConfigs.map((config) => (
              <AnniversaryCard
                key={config.employeeId}
                config={config}
                employeeName={employeeNames[config.employeeId] ?? config.employeeId}
                onApply={() => onApplyAnniversary(config.employeeId)}
                isApplying={isApplyingAnniversary}
              />
            ))}
          </div>
        </div>
      </div>

      {status.recentEvents.length > 0 && (
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Recent Activity (Last 30 Days)
            </h3>
          </div>
          <div className="px-6 py-2">
            {status.recentEvents.slice(0, 5).map((event) => (
              <RecentEventRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
