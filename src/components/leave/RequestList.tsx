import type { LeaveRequest, HCMBalance } from '@/lib/types';
import { RequestCard } from './RequestCard';

type OptimisticRequest = LeaveRequest & { optimisticStatus?: 'pending' | 'rolled-back' };

export interface RequestListProps {
  requests: OptimisticRequest[];
  isLoading?: boolean;
  isEmpty?: boolean;
  isManager?: boolean;
  balances?: HCMBalance[];
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, note: string) => Promise<void>;
  isDeciding?: Record<string, boolean>;
  staleBalanceIds?: Set<string>;
}

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-5 animate-pulse flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2 flex-1">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-2/5" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
        </div>
        <div className="h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full w-20" />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-20" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-12" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
      </div>
    </div>
  );
}

function getCurrentBalance(
  request: LeaveRequest,
  balances?: HCMBalance[]
): number | undefined {
  if (!balances) return undefined;
  return balances.find(
    (b) => b.employeeId === request.employeeId && b.location === request.location && b.leaveType === request.leaveType
  )?.balance;
}

function isBalanceStale(request: LeaveRequest, staleBalanceIds?: Set<string>): boolean {
  if (!staleBalanceIds) return false;
  return staleBalanceIds.has(`${request.employeeId}:${request.location}:${request.leaveType}`);
}

export function RequestList({
  requests,
  isLoading = false,
  isEmpty = false,
  isManager = false,
  balances,
  onApprove,
  onReject,
  isDeciding,
  staleBalanceIds,
}: RequestListProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading requests"
        className="flex flex-col gap-4"
      >
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isEmpty || requests.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-500 dark:text-zinc-400"
      >
        <svg
          aria-hidden="true"
          className="w-12 h-12 opacity-40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <p className="text-sm font-medium">No leave requests found</p>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending');
  const decided = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="flex flex-col gap-6">
      {pending.length > 0 && (
        <section aria-label="Pending requests">
          {isManager && (
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Pending ({pending.length})
            </h3>
          )}
          <div className="flex flex-col gap-4">
            {pending.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                optimisticStatus={request.optimisticStatus}
                isManager={isManager}
                currentBalance={getCurrentBalance(request, balances)}
                onApprove={onApprove}
                onReject={onReject}
                isDeciding={isDeciding?.[request.id]}
                isBalanceStale={isBalanceStale(request, staleBalanceIds)}
              />
            ))}
          </div>
        </section>
      )}

      {decided.length > 0 && (
        <section aria-label="Decided requests">
          {isManager && (
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Decided ({decided.length})
            </h3>
          )}
          <div className="flex flex-col gap-4">
            {decided.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                optimisticStatus={request.optimisticStatus}
                isManager={isManager}
                currentBalance={getCurrentBalance(request, balances)}
                onApprove={onApprove}
                onReject={onReject}
                isDeciding={isDeciding?.[request.id]}
                isBalanceStale={isBalanceStale(request, staleBalanceIds)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default RequestList;
