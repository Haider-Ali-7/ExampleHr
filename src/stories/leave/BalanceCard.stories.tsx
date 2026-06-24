import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BalanceCard } from '@/components/leave/BalanceCard';

const meta = {
  title: 'Leave/BalanceCard',
  component: BalanceCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof BalanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      balance: 10,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    isStale: false,
    isLoading: false,
  },
};

export const Loading: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      balance: 0,
      lastUpdated: '',
    },
    isLoading: true,
  },
};

export const Stale: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      balance: 10,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    isStale: true,
  },
};

export const ZeroBalance: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'London',
      leaveType: 'sick',
      balance: 0,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    isStale: false,
    isLoading: false,
  },
};

export const SickLeave: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick',
      balance: 5,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    isStale: false,
    isLoading: false,
  },
};

export const LongLocation: Story = {
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'Singapore & Remote',
      leaveType: 'personal',
      balance: 3,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    isStale: false,
    isLoading: false,
  },
};

export const BalanceRefreshed: Story = {
  name: 'Balance refreshed mid-session',
  args: {
    balance: {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      balance: 7,
      lastUpdated: new Date().toISOString(),
    },
    isStale: false,
    isLoading: false,
  },
};
