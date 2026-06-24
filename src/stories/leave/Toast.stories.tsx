import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { Toast } from '@/components/leave/Toast';

const meta = {
  title: 'Leave/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onDismiss: fn(),
    autoDismissMs: 0,
  },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    message: 'Your leave request has been submitted successfully.',
    type: 'success',
  },
};

export const Error: Story = {
  args: {
    message: 'Failed to submit your request. Please try again.',
    type: 'error',
  },
};

export const Warning: Story = {
  args: {
    message: 'Your leave balance is running low.',
    type: 'warning',
  },
};

export const Info: Story = {
  args: {
    message: 'Leave balances are refreshed every 24 hours from the HR system.',
    type: 'info',
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'We were unable to process your leave request at this time. The HR system is temporarily unavailable. Please wait a few minutes and try submitting your request again. If the problem persists, contact your HR administrator.',
    type: 'error',
  },
};

export const NoAutoDismiss: Story = {
  args: {
    message: 'This notification will not auto-dismiss. Click the X to close it.',
    type: 'info',
    autoDismissMs: 0,
  },
};
