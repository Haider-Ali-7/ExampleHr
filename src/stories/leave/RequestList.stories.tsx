import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { RequestList } from '@/components/leave/RequestList';

const meta = {
  title: 'Leave/RequestList',
  component: RequestList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    onApprove: fn(),
    onReject: fn(),
  },
} satisfies Meta<typeof RequestList>;

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
  reason: 'Summer vacation',
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
    requests: [pendingRequest, approvedRequest, rejectedRequest],
    isLoading: false,
    isEmpty: false,
    isManager: false,
  },
};

export const Loading: Story = {
  args: {
    requests: [],
    isLoading: true,
    isEmpty: false,
    isManager: false,
  },
};

export const Empty: Story = {
  args: {
    requests: [],
    isLoading: false,
    isEmpty: true,
    isManager: false,
  },
};

export const ManagerView: Story = {
  args: {
    requests: [
      pendingRequest,
      {
        ...pendingRequest,
        id: 'req_004',
        employeeId: 'emp_002',
        employeeName: 'Sarah Chen',
        location: 'London',
        leaveType: 'annual' as const,
        startDate: '2026-07-10',
        endDate: '2026-07-12',
        days: 3,
        reason: 'Personal appointment',
        submittedAt: '2026-06-24T11:00:00Z',
      },
      approvedRequest,
    ],
    isLoading: false,
    isEmpty: false,
    isManager: true,
    balances: sampleBalances,
  },
};

export const AllPending: Story = {
  args: {
    requests: [
      pendingRequest,
      {
        ...pendingRequest,
        id: 'req_005',
        startDate: '2026-08-10',
        endDate: '2026-08-11',
        days: 2,
        reason: 'Medical appointment',
        leaveType: 'sick' as const,
        submittedAt: '2026-06-23T15:00:00Z',
      },
    ],
    isLoading: false,
    isEmpty: false,
    isManager: false,
  },
};

export const WithOptimisticPending: Story = {
  args: {
    requests: [
      approvedRequest,
      {
        ...pendingRequest,
        id: 'req_opt_001',
        optimisticStatus: 'pending' as const,
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        days: 3,
        reason: 'Conference attendance',
        submittedAt: '2026-06-24T12:00:00Z',
      },
      rejectedRequest,
    ],
    isLoading: false,
    isEmpty: false,
    isManager: false,
  },
};

export const WithRolledBackRequest: Story = {
  name: 'With rolled-back optimistic request',
  args: {
    requests: [
      approvedRequest,
      {
        ...pendingRequest,
        id: 'req_opt_rolled_001',
        optimisticStatus: 'rolled-back' as const,
        startDate: '2026-09-10',
        endDate: '2026-09-12',
        days: 3,
        reason: 'Family emergency',
        submittedAt: '2026-06-24T13:00:00Z',
      },
      rejectedRequest,
    ],
    isLoading: false,
    isEmpty: false,
    isManager: false,
  },
};

export const ManagerWithPendingRequests: Story = {
  name: 'Manager — pending requests with balances',
  args: {
    requests: [
      pendingRequest,
      {
        ...pendingRequest,
        id: 'req_006',
        employeeId: 'emp_002',
        employeeName: 'Sarah Chen',
        location: 'London',
        leaveType: 'annual' as const,
        startDate: '2026-07-14',
        endDate: '2026-07-16',
        days: 3,
        reason: 'Family visit',
        submittedAt: '2026-06-24T09:30:00Z',
      },
    ],
    isLoading: false,
    isEmpty: false,
    isManager: true,
    balances: sampleBalances,
  },
};
