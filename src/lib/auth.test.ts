import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted above all imports, so mocks referenced inside the factory
// must be created with vi.hoisted so they exist before the factory runs.
const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn<(path: string, encoding: string) => Promise<string>>(),
}));

// auth.ts does: import fs from 'node:fs/promises'
// In Vite's ESM interop the default import resolves to the module namespace.
vi.mock('node:fs/promises', () => ({
  default: { readFile: mockReadFile },
  readFile: mockReadFile,
}));

import { getUsers, validateCredentials } from '@/lib/auth';

const mockData = {
  users: [
    { id: 'usr_001', email: 'employee1@gmail.com', password: '123456', name: 'John Smith', role: 'employee', employeeId: 'emp_001' },
    { id: 'usr_002', email: 'manager1@gmail.com', password: 'secret', name: 'Alex Manager', role: 'manager', employeeId: null },
  ],
};

beforeEach(() => {
  mockReadFile.mockReset();
  mockReadFile.mockResolvedValue(JSON.stringify(mockData));
});

describe('getUsers', () => {
  it('returns all users without passwords', async () => {
    const users = await getUsers();
    expect(users).toHaveLength(2);
    for (const user of users) {
      expect(user).not.toHaveProperty('password');
    }
  });

  it('returns users with correct fields', async () => {
    const users = await getUsers();
    const john = users.find((u) => u.email === 'employee1@gmail.com');
    expect(john).toBeDefined();
    expect(john?.name).toBe('John Smith');
    expect(john?.role).toBe('employee');
    expect(john?.employeeId).toBe('emp_001');
  });

  it('handles empty users array', async () => {
    mockReadFile.mockResolvedValueOnce(JSON.stringify({ users: [] }));
    const users = await getUsers();
    expect(users).toHaveLength(0);
  });
});

describe('validateCredentials', () => {
  it('returns user (without password) for valid credentials', async () => {
    const user = await validateCredentials('employee1@gmail.com', '123456');
    expect(user).not.toBeNull();
    expect(user?.name).toBe('John Smith');
    expect(user).not.toHaveProperty('password');
  });

  it('returns null for wrong password', async () => {
    const user = await validateCredentials('employee1@gmail.com', 'wrongpass');
    expect(user).toBeNull();
  });

  it('returns null for unknown email', async () => {
    const user = await validateCredentials('nobody@example.com', '123456');
    expect(user).toBeNull();
  });

  it('is case-insensitive for email', async () => {
    const user = await validateCredentials('EMPLOYEE1@GMAIL.COM', '123456');
    expect(user).not.toBeNull();
    expect(user?.email).toBe('employee1@gmail.com');
  });

  it('returns null for mismatched manager password', async () => {
    const user = await validateCredentials('manager1@gmail.com', 'wrong');
    expect(user).toBeNull();
  });

  it('returns correct manager user for valid credentials', async () => {
    const user = await validateCredentials('manager1@gmail.com', 'secret');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('manager');
    expect(user?.employeeId).toBeNull();
    expect(user).not.toHaveProperty('password');
  });

  it('returns null when both email and password are empty', async () => {
    const user = await validateCredentials('', '');
    expect(user).toBeNull();
  });
});
