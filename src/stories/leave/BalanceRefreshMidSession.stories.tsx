import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BalanceGrid } from '@/components/leave/BalanceGrid';

// This composed story demonstrates the "balance-refreshed-mid-session" state.
// It renders a stale BalanceGrid alongside an amber alert banner that informs
// the user their balances may have changed and invites them to refresh.
// No hooks are used — all state is derived from props passed to the components.

function BalanceRefreshMidSession() {
  const staleBalances = [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual' as const,
      balance: 10,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick' as const,
      balance: 5,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'London',
      leaveType: 'annual' as const,
      balance: 5,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div
        role="status"
        aria-live="polite"
        className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3"
      >
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <svg
            aria-hidden="true"
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium">
            Your leave balances may have changed.
          </span>
        </div>
        <button
          type="button"
          className="text-sm font-semibold text-amber-800 dark:text-amber-200 underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded"
        >
          Refresh now
        </button>
      </div>

      <BalanceGrid balances={staleBalances} isStale={true} />
    </div>
  );
}

const meta = {
  title: 'Leave/BalanceRefreshMidSession',
  component: BalanceRefreshMidSession,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BalanceRefreshMidSession>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
