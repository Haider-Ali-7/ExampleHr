"use client";

import { BalanceGrid } from "@/components/leave/BalanceGrid";
import { LeaveRequestForm } from "@/components/leave/LeaveRequestForm";
import { RequestList } from "@/components/leave/RequestList";
import { SyncIndicator } from "@/components/leave/SyncIndicator";
import { StaleBalanceBanner } from "@/components/leave/StaleBalanceBanner";
import { ToastContainer } from "@/components/leave/ToastContainer";
import { AuthGuard } from "@/components/AuthGuard";
import { useEmployeeLeave } from "@/hooks/useEmployeeLeave";
import { useAuthStore } from "@/store/authStore";

function EmployeeDashboard() {
  const user = useAuthStore((s) => s.user);
  const employeeId = user?.employeeId ?? "emp_001";
  const employeeName = user?.name ?? "Employee";

  const {
    balances,
    requests,
    toasts,
    isLoadingBalances,
    isFetchingBalances,
    isLoadingRequests,
    isBalancesStale,
    isSubmitting,
    submitError,
    submitCount,
    lastSync,
    sseError,
    submitRequest,
    dismissToast,
    refreshBalances,
  } = useEmployeeLeave(employeeId, employeeName);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Leave
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {employeeName}
          </p>
        </div>
        <div className="sm:mt-1">
          <SyncIndicator lastSync={lastSync} hasError={!!sseError} />
        </div>
      </div>

      <StaleBalanceBanner isStale={isBalancesStale} onRefresh={refreshBalances} isRefreshing={isFetchingBalances} />

      <section>
        <BalanceGrid
          balances={balances}
          isLoading={isLoadingBalances}
          isEmpty={balances.length === 0}
          isStale={isBalancesStale}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Request Leave
        </h2>
        <LeaveRequestForm
          employeeId={employeeId}
          employeeName={employeeName}
          balances={balances}
          onSubmit={submitRequest}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitCount={submitCount}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          My Requests
        </h2>
        <RequestList
          requests={requests}
          isLoading={isLoadingRequests}
          isEmpty={requests.length === 0}
        />
      </section>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function EmployeePage() {
  return (
    <AuthGuard requiredRole="employee">
      <EmployeeDashboard />
    </AuthGuard>
  );
}
