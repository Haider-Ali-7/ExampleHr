export const queryKeys = {
  balances: {
    all: ['balances'] as const,
    byEmployee: (employeeId: string) => ['balances', employeeId] as const,
  },
  requests: {
    all: ['requests'] as const,
    byEmployee: (employeeId: string) => ['requests', { employeeId }] as const,
  },
  admin: {
    employees: ['admin', 'employees'] as const,
  },
  simulation: {
    status: ['simulation', 'status'] as const,
  },
} as const;
