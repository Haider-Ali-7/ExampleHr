import type { HCMBalance } from '@/lib/types';
import { BalanceCard } from './BalanceCard';

export interface BalanceGridProps {
  balances: HCMBalance[];
  isLoading?: boolean;
  isEmpty?: boolean;
  isStale?: boolean;
}

export function BalanceGrid({ balances, isLoading = false, isEmpty = false, isStale = false }: BalanceGridProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading leave balances"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {[0, 1, 2].map((i) => (
          <BalanceCard
            key={i}
            isLoading
            balance={{
              employeeId: '',
              employeeName: '',
              location: '',
              leaveType: 'annual',
              balance: 0,
              lastUpdated: '',
            }}
          />
        ))}
      </div>
    );
  }

  if (isEmpty || balances.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm font-medium">No leave balances found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {balances.map((balance) => (
        <BalanceCard
          key={`${balance.employeeId}-${balance.leaveType}-${balance.location}`}
          balance={balance}
          isStale={isStale}
        />
      ))}
    </div>
  );
}

export default BalanceGrid;
