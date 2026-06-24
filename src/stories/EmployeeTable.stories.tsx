import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EmployeeTable } from "@/components/leave/EmployeeTable";
import type { EmployeeWithBalances } from "@/app/api/admin/employees/route";

const EMPLOYEES: EmployeeWithBalances[] = [
  {
    id: "emp_001",
    name: "John Smith",
    email: "employee1@gmail.com",
    balances: [
      { location: "NY", annual: 10, sick: 5, personal: 3 },
      { location: "London", annual: 5, sick: 3, personal: 2 },
    ],
  },
  {
    id: "emp_002",
    name: "Sarah Johnson",
    email: "employee2@gmail.com",
    balances: [
      { location: "NY", annual: 15, sick: 6, personal: 4 },
      { location: "Singapore", annual: 8, sick: 4, personal: 2 },
    ],
  },
  {
    id: "emp_003",
    name: "Marcus Chen",
    email: "employee3@gmail.com",
    balances: [{ location: "London", annual: 0, sick: 7, personal: 1 }],
  },
];

const meta = {
  title: "Leave/EmployeeTable",
  component: EmployeeTable,
  parameters: {
    layout: "padded",
  },
  args: {
    employees: EMPLOYEES,
    isLoading: false,
    staleCells: new Set<string>(),
    onUpdateBalance: async () => {},
  },
} satisfies Meta<typeof EmployeeTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {};

export const WithStaleCells: Story = {
  name: "With stale cells",
  args: {
    staleCells: new Set(["emp_001:NY:annual", "emp_002:Singapore:sick"]),
  },
};

export const Loading: Story = {
  name: "Loading skeleton",
  args: {
    employees: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  name: "Empty state",
  args: {
    employees: [],
    isLoading: false,
  },
};

export const SingleEmployee: Story = {
  name: "Single employee",
  args: {
    employees: [EMPLOYEES[0]],
  },
};

export const SaveError: Story = {
  name: "Save error flow",
  args: {
    onUpdateBalance: async () => {
      throw new Error("HCM rejected the update");
    },
  },
};
