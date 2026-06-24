import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { RequestCard } from '@/components/leave/RequestCard';

const meta = {
  title: 'Leave/RequestCard',
  component: RequestCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-lg mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onApprove: fn(),
    onReject: fn(),
  },
} satisfies Meta<typeof RequestCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const pendingRequest = {
  id: 'req_001',
  employeeId: 'emp_001',
  employeeName: 'John Smith',
  location: 'NY',
  leaveType: 'annual' as const,
  startDate: '2026-07-01',
  endDate: '2026-07-05',
  days: 5,
  reason: 'Summer vacation with family.',
  status: 'pending' as const,
  submittedAt: '2026-06-24T10:00:00Z',
};

const approvedRequest = {
  id: 'req_002',
  employeeId: 'emp_001',
  employeeName: 'John Smith',
  location: 'London',
  leaveType: 'sick' as const,
  startDate: '2026-06-20',
  endDate: '2026-06-21',
  days: 2,
  reason: 'Flu',
  status: 'approved' as const,
  submittedAt: '2026-06-19T09:00:00Z',
  decidedAt: '2026-06-19T12:00:00Z',
  decidedBy: 'Alex Manager',
  balanceAtDecision: 3,
};

const rejectedRequest = {
  id: 'req_003',
  employeeId: 'emp_002',
  employeeName: 'Sarah Chen',
  location: 'Singapore',
  leaveType: 'annual' as const,
  startDate: '2026-08-01',
  endDate: '2026-08-03',
  days: 3,
  reason: 'Family event',
  status: 'rejected' as const,
  submittedAt: '2026-06-23T08:00:00Z',
  decidedAt: '2026-06-24T09:00:00Z',
  decidedBy: 'Alex Manager',
  managerNote: 'Team is short-staffed during this period',
};

export const PendingEmployee: Story = {
  args: {
    request: pendingRequest,
    isManager: false,
  },
};

export const ApprovedEmployee: Story = {
  args: {
    request: approvedRequest,
    isManager: false,
  },
};

export const RejectedEmployee: Story = {
  args: {
    request: rejectedRequest,
    isManager: false,
  },
};

export const OptimisticPending: Story = {
  args: {
    request: {
      ...pendingRequest,
      id: 'req_opt_001',
    },
    optimisticStatus: 'pending',
    isManager: false,
  },
};

export const OptimisticRolledBack: Story = {
  args: {
    request: {
      ...pendingRequest,
      id: 'req_opt_002',
    },
    optimisticStatus: 'rolled-back',
    isManager: false,
  },
};

export const ManagerPending: Story = {
  args: {
    request: pendingRequest,
    isManager: true,
    currentBalance: 10,
  },
};

export const ManagerDeciding: Story = {
  args: {
    request: pendingRequest,
    isManager: true,
    currentBalance: 10,
    isDeciding: true,
  },
};

export const HCMRejected: Story = {
  args: {
    request: {
      ...rejectedRequest,
      id: 'req_hcm_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual' as const,
      status: 'rejected' as const,
      reason: 'Annual leave — full week off',
      managerNote: 'Balance insufficient in HCM',
      decidedBy: 'HR System',
    },
    isManager: false,
  },
};

export const ManagerStaleBalance: Story = {
  name: 'Manager — Stale Balance',
  args: {
    request: pendingRequest,
    isManager: true,
    currentBalance: 10,
    isBalanceStale: true,
  },
};

export const ManagerDecidingWithStaleBalance: Story = {
  name: 'Manager — Deciding + Stale Balance',
  args: {
    request: pendingRequest,
    isManager: true,
    currentBalance: 10,
    isDeciding: true,
    isBalanceStale: true,
  },
};
