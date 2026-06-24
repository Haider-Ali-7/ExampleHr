import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm';

const meta = {
  title: 'Leave/LeaveRequestForm',
  component: LeaveRequestForm,
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
    onSubmit: fn(),
    employeeId: 'emp_001',
    employeeName: 'John Smith',
  },
} satisfies Meta<typeof LeaveRequestForm>;

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
    isSubmitting: false,
    submitError: null,
  },
};

export const Submitting: Story = {
  args: {
    balances: sampleBalances,
    isSubmitting: true,
    submitError: null,
  },
};

export const SubmitError: Story = {
  args: {
    balances: sampleBalances,
    isSubmitting: false,
    submitError: 'Server error, please try again',
  },
};

// The form computes insufficiency based on balance vs days requested.
// Provide a balance set where the London/sick combo has 0 days so the
// user can see the insufficient-balance warning if they pick that option.
export const InsufficientBalance: Story = {
  args: {
    balances: [
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'annual' as const,
        balance: 0,
        lastUpdated: '2026-06-24T08:00:00Z',
      },
      {
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'sick' as const,
        balance: 0,
        lastUpdated: '2026-06-24T08:00:00Z',
      },
    ],
    isSubmitting: false,
    submitError: null,
  },
};

export const NoBalances: Story = {
  args: {
    balances: [],
    isSubmitting: false,
    submitError: null,
  },
};
