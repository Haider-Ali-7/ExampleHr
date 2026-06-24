import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { StaleBalanceBanner } from '@/components/leave/StaleBalanceBanner';

const meta = {
  title: 'Leave/StaleBalanceBanner',
  component: StaleBalanceBanner,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    onRefresh: fn(),
  },
} satisfies Meta<typeof StaleBalanceBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isStale: false,
  },
};

export const Stale: Story = {
  args: {
    isStale: true,
  },
};

export const Refreshing: Story = {
  args: {
    isStale: true,
    isRefreshing: true,
  },
};

export const Hidden: Story = {
  name: 'Hidden (not stale)',
  args: {
    isStale: false,
  },
};

export const Visible: Story = {
  name: 'Visible (stale)',
  args: {
    isStale: true,
    isRefreshing: false,
  },
};;
