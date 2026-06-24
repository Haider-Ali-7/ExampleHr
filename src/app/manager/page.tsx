"use client";

import { useState } from "react";
import { RequestList } from "@/components/leave/RequestList";
import { SyncIndicator } from "@/components/leave/SyncIndicator";
import { ToastContainer } from "@/components/leave/ToastContainer";
import { AuthGuard } from "@/components/AuthGuard";
import { useManagerLeave } from "@/hooks/useManagerLeave";
import { useAuthStore } from "@/store/authStore";

type Tab = "pending" | "decided";

function ManagerDashboard() {
  const user = useAuthStore((s) => s.user);
  const managerName = user?.name ?? "Manager";

  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const {
    pendingRequests,
    decidedRequests,
    balances,
    isLoadingRequests,
    lastSync,
    sseError,
    decideRequest,
    isDeciding,
    toasts,
    dismissToast,
  } = useManagerLeave();

  const handleApprove = (id: string): Promise<void> => {
    return decideRequest(id, { status: "approved", decidedBy: managerName });
  };

  const handleReject = (id: string, note: string): Promise<void> => {
    return decideRequest(id, {
      status: "rejected",
      managerNote: note,
      decidedBy: managerName,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Leave Requests
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manager Dashboard &mdash; {managerName}
          </p>
        </div>
        <div className="sm:mt-1">
          <SyncIndicator lastSync={lastSync} hasError={!!sseError} />
        </div>
      </div>

      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-0">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "pending"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Pending
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("decided")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "decided"
                ? "border-zinc-900 dark:border-white text-zinc-900 dark:text-white"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Decided
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {decidedRequests.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "pending" && (
        <RequestList
          requests={pendingRequests}
          isLoading={isLoadingRequests}
          isEmpty={pendingRequests.length === 0}
          isManager={true}
          balances={balances}
          onApprove={handleApprove}
          onReject={handleReject}
          isDeciding={isDeciding}
        />
      )}

      {activeTab === "decided" && (
        <RequestList
          requests={decidedRequests}
          isLoading={false}
          isEmpty={decidedRequests.length === 0}
          isManager={true}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function ManagerPage() {
  return (
    <AuthGuard requiredRole={["manager", "admin"]}>
      <ManagerDashboard />
    </AuthGuard>
  );
}
