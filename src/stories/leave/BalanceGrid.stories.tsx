import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BalanceGrid } from '@/components/leave/BalanceGrid';

const meta = {
  title: 'Leave/BalanceGrid',
  component: BalanceGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BalanceGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleBalances = [
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
  {
    employeeId: 'emp_001',
    employeeName: 'John Smith',
    location: 'London',
    leaveType: 'sick' as const,
    balance: 0,
    lastUpdated: '2026-06-24T08:00:00Z',
  },
];

export const Default: Story = {
  args: {
    balances: sampleBalances,
    isLoading: false,
    isEmpty: false,
    isStale: false,
  },
};

export const Loading: Story = {
  args: {
    balances: [],
    isLoading: true,
    isEmpty: false,
    isStale: false,
  },
};

export const Empty: Story = {
  args: {
    balances: [],
    isLoading: false,
    isEmpty: true,
    isStale: false,
  },
};

export const Stale: Story = {
  args: {
    balances: sampleBalances,
    isLoading: false,
    isEmpty: false,
    isStale: true,
  },
};

export const SingleBalance: Story = {
  args: {
    balances: [sampleBalances[0]],
    isLoading: false,
    isEmpty: false,
    isStale: false,
  },
};

export const WithStaleBalances: Story = {
  name: 'With stale balances',
  args: {
    balances: sampleBalances,
    isLoading: false,
    isEmpty: false,
    isStale: true,
  },
};

export const MidSessionRefresh: Story = {
  name: 'Mid-session refresh (balance changed)',
  args: {
    balances: [
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'annual' as const,
        balance: 7,
        lastUpdated: new Date().toISOString(),
      },
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'sick' as const,
        balance: 5,
        lastUpdated: new Date().toISOString(),
      },
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'London',
        leaveType: 'annual' as const,
        balance: 5,
        lastUpdated: new Date().toISOString(),
      },
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'London',
        leaveType: 'sick' as const,
        balance: 0,
        lastUpdated: new Date().toISOString(),
      },
    ],
    isLoading: false,
    isEmpty: false,
    isStale: false,
  },
};
