import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { LoginForm } from '@/components/leave/LoginForm';

const meta = {
  title: 'Leave/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isSubmitting: false,
    error: null,
  },
};

export const Submitting: Story = {
  args: {
    isSubmitting: true,
    error: null,
  },
};

export const InvalidCredentials: Story = {
  args: {
    isSubmitting: false,
    error: 'Invalid email or password',
  },
};
