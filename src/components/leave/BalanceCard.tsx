import type { HCMBalance } from '@/lib/types';

export interface BalanceCardProps {
  balance: HCMBalance;
  isStale?: boolean;
  isLoading?: boolean;
}

const leaveTypeLabel: Record<HCMBalance['leaveType'], string> = {
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
};

const leaveTypeBadgeClass: Record<HCMBalance['leaveType'], string> = {
  annual: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sick: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function BalanceCard({ balance, isStale = false, isLoading = false }: BalanceCardProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading balance"
        className="w-full sm:w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-5 animate-pulse"
      >
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-3" />
        <div className="h-6 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3 mb-4" />
        <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-1/4" />
      </div>
    );
  }

  return (
    <div
      className={`w-full sm:w-72 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-5 flex flex-col gap-3 ${isStale ? 'opacity-60' : ''}`}
      aria-label={`${leaveTypeLabel[balance.leaveType]} leave balance for ${balance.location}`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
          {balance.location}
        </span>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${leaveTypeBadgeClass[balance.leaveType]}`}
        >
          {leaveTypeLabel[balance.leaveType]}
        </span>
      </div>

      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">
          {balance.balance}
        </span>
        <span className="text-zinc-500 dark:text-zinc-400 text-sm mb-0.5">days</span>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-zinc-400 dark:text-zinc-500 text-xs">
          Updated {new Date(balance.lastUpdated).toLocaleDateString()}
        </span>
        {isStale && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-0.5 text-xs font-medium">
            <svg
              aria-hidden="true"
              className="w-3 h-3"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            May be outdated
          </span>
        )}
      </div>
    </div>
  );
}

export default BalanceCard;
