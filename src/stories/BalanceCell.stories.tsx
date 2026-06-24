import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BalanceCell } from "@/components/leave/BalanceCell";

const meta = {
  title: "Leave/BalanceCell",
  component: BalanceCell,
  parameters: {
    layout: "centered",
  },
  args: {
    employeeId: "emp_001",
    location: "NY",
    leaveType: "annual",
    balance: 10,
    isStale: false,
    onSave: async () => {},
  },
} satisfies Meta<typeof BalanceCell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Read: Story = {
  name: "Read mode",
};

export const Stale: Story = {
  name: "Stale (amber dot)",
  args: {
    isStale: true,
  },
};

export const NullBalance: Story = {
  name: "Null balance",
  args: {
    balance: null,
  },
};

export const ZeroBalance: Story = {
  name: "Zero balance",
  args: {
    balance: 0,
  },
};

export const Editing: Story = {
  name: "Editing mode",
  play: async ({ canvas }) => {
    const { userEvent } = await import("@storybook/test");
    const cell = canvas.getByRole("button", { name: /click to edit/i });
    await userEvent.click(cell);
  },
};

export const SaveError: Story = {
  name: "Error state",
  args: {
    onSave: async () => {
      throw new Error("Balance not found for this combination");
    },
  },
  play: async ({ canvas }) => {
    const { userEvent } = await import("@storybook/test");
    const cell = canvas.getByRole("button", { name: /click to edit/i });
    await userEvent.click(cell);
    const saveBtn = canvas.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
  },
};

export const Saving: Story = {
  name: "Saving state",
  args: {
    onSave: () =>
      new Promise(() => {
      }),
  },
  play: async ({ canvas }) => {
    const { userEvent } = await import("@storybook/test");
    const cell = canvas.getByRole("button", { name: /click to edit/i });
    await userEvent.click(cell);
    const saveBtn = canvas.getByRole("button", { name: /save/i });
    await userEvent.click(saveBtn);
  },
};
