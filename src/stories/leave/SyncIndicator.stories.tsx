import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SyncIndicator } from '@/components/leave/SyncIndicator';

const meta = {
  title: 'Leave/SyncIndicator',
  component: SyncIndicator,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SyncIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

// A timestamp less than 1 minute ago so the component renders "Live"
const justNow = new Date(Date.now() - 20_000).toISOString();

// A timestamp 10 minutes in the past so the component renders "Last updated: 10 minutes ago"
const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

export const Live: Story = {
  args: {
    lastSync: justNow,
    isSyncing: false,
    hasError: false,
  },
};

export const Reconnecting: Story = {
  args: {
    lastSync: tenMinutesAgo,
    isSyncing: false,
    hasError: true,
  },
};

export const Stale: Story = {
  args: {
    lastSync: tenMinutesAgo,
    isSyncing: false,
    hasError: false,
  },
};

export const Syncing: Story = {
  args: {
    lastSync: tenMinutesAgo,
    isSyncing: true,
    hasError: false,
  },
};

export const NeverSynced: Story = {
  args: {
    lastSync: null,
    isSyncing: false,
    hasError: false,
  },
};

export const Connected: Story = {
  name: 'Connected (live)',
  args: {
    lastSync: new Date(Date.now() - 15_000).toISOString(),
    isSyncing: false,
    hasError: false,
  },
};

export const Disconnected: Story = {
  name: 'Disconnected (stale)',
  args: {
    lastSync: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isSyncing: false,
    hasError: false,
  },
};

export const Error: Story = {
  name: 'Error (has error)',
  args: {
    lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isSyncing: false,
    hasError: true,
  },
};
