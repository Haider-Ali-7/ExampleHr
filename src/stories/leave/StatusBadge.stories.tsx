import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatusBadge } from '@/components/leave/StatusBadge';

const meta = {
  title: 'Leave/StatusBadge',
  component: StatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const OptimisticPending: Story = {
  args: {
    status: 'optimistic-pending',
  },
};

export const Approved: Story = {
  args: {
    status: 'approved',
  },
};

export const Rejected: Story = {
  args: {
    status: 'rejected',
  },
};

export const HCMRejected: Story = {
  args: {
    status: 'hcm-rejected',
  },
};
