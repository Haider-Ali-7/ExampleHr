import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted above all imports, so mocks referenced inside the factory
// must be created with vi.hoisted so they exist before the factory runs.
const { mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn<(path: string, encoding: string) => Promise<string>>(),
  mockWriteFile: vi.fn<(path: string, data: string, encoding: string) => Promise<void>>(),
}));

// hcm.ts does: import fs from 'node:fs/promises'
// In Vite's ESM interop the default import resolves to the module namespace.
vi.mock('node:fs/promises', () => ({
  default: { readFile: mockReadFile, writeFile: mockWriteFile },
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

import {
  getBalances,
  getBalance,
  updateBalance,
  getRequests,
  getRequest,
  createRequest,
  updateRequest,
} from '@/lib/hcm';

const seedData = {
  users: [],
  balances: [
    { employeeId: 'emp_001', employeeName: 'John Smith', location: 'NY', leaveType: 'annual', balance: 10, lastUpdated: '2026-06-24T08:00:00Z' },
    { employeeId: 'emp_001', employeeName: 'John Smith', location: 'NY', leaveType: 'sick', balance: 5, lastUpdated: '2026-06-24T08:00:00Z' },
    { employeeId: 'emp_001', employeeName: 'John Smith', location: 'London', leaveType: 'annual', balance: 7, lastUpdated: '2026-06-24T08:00:00Z' },
    { employeeId: 'emp_002', employeeName: 'Sarah Johnson', location: 'NY', leaveType: 'annual', balance: 15, lastUpdated: '2026-06-24T08:00:00Z' },
  ],
  requests: [
    {
      id: 'req_001',
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      startDate: '2026-07-01',
      endDate: '2026-07-05',
      days: 5,
      reason: 'Vacation',
      status: 'pending',
      submittedAt: '2026-06-24T10:00:00Z',
    },
    {
      id: 'req_002',
      employeeId: 'emp_002',
      employeeName: 'Sarah Johnson',
      location: 'NY',
      leaveType: 'sick',
      startDate: '2026-06-20',
      endDate: '2026-06-20',
      days: 1,
      reason: 'Flu',
      status: 'approved',
      submittedAt: '2026-06-19T09:00:00Z',
    },
  ],
};

beforeEach(() => {
  mockReadFile.mockReset();
  mockWriteFile.mockReset();
  mockReadFile.mockResolvedValue(JSON.stringify(seedData));
  mockWriteFile.mockResolvedValue(undefined);
});

// ── getBalances ──────────────────────────────────────────────────────────────

describe('getBalances', () => {
  it('returns all balances when called with no filters', async () => {
    const balances = await getBalances();
    expect(balances).toHaveLength(4);
  });

  it('filters by employeeId', async () => {
    const balances = await getBalances('emp_001');
    expect(balances).toHaveLength(3);
    expect(balances.every((b) => b.employeeId === 'emp_001')).toBe(true);
  });

  it('filters by location', async () => {
    const balances = await getBalances(undefined, 'NY');
    expect(balances).toHaveLength(3);
    expect(balances.every((b) => b.location === 'NY')).toBe(true);
  });

  it('filters by both employeeId and location', async () => {
    const balances = await getBalances('emp_001', 'NY');
    expect(balances).toHaveLength(2);
  });

  it('returns empty array when no match', async () => {
    const balances = await getBalances('emp_999');
    expect(balances).toHaveLength(0);
  });
});

// ── getBalance ───────────────────────────────────────────────────────────────

describe('getBalance', () => {
  it('returns exact balance record', async () => {
    const balance = await getBalance('emp_001', 'NY', 'annual');
    expect(balance).not.toBeNull();
    expect(balance?.balance).toBe(10);
  });

  it('returns null for non-existent combination', async () => {
    const balance = await getBalance('emp_001', 'Tokyo', 'annual');
    expect(balance).toBeNull();
  });
});

// ── updateBalance ────────────────────────────────────────────────────────────

describe('updateBalance', () => {
  it('updates the balance and writes the file', async () => {
    const updated = await updateBalance('emp_001', 'NY', 'annual', 20);
    expect(updated.balance).toBe(20);
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('sets a new lastUpdated timestamp', async () => {
    const before = new Date('2026-06-24T08:00:00Z').getTime();
    const updated = await updateBalance('emp_001', 'NY', 'annual', 20);
    const after = new Date(updated.lastUpdated).getTime();
    expect(after).toBeGreaterThanOrEqual(before);
  });

  it('throws when balance record is not found', async () => {
    await expect(updateBalance('emp_999', 'NY', 'annual', 5)).rejects.toThrow(
      'Balance not found',
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});

// ── getRequests ──────────────────────────────────────────────────────────────

describe('getRequests', () => {
  it('returns all requests when called with no filters', async () => {
    const requests = await getRequests();
    expect(requests).toHaveLength(2);
  });

  it('filters by employeeId', async () => {
    const requests = await getRequests({ employeeId: 'emp_001' });
    expect(requests).toHaveLength(1);
    expect(requests[0].employeeId).toBe('emp_001');
  });

  it('filters by status', async () => {
    const requests = await getRequests({ status: 'pending' });
    expect(requests).toHaveLength(1);
    expect(requests[0].id).toBe('req_001');
  });

  it('filters by location', async () => {
    const requests = await getRequests({ location: 'NY' });
    expect(requests).toHaveLength(2);
  });

  it('returns empty array when no match', async () => {
    const requests = await getRequests({ employeeId: 'emp_999' });
    expect(requests).toHaveLength(0);
  });
});

// ── getRequest ───────────────────────────────────────────────────────────────

describe('getRequest', () => {
  it('returns a specific request by id', async () => {
    const req = await getRequest('req_001');
    expect(req).not.toBeNull();
    expect(req?.employeeId).toBe('emp_001');
  });

  it('returns null for unknown id', async () => {
    const req = await getRequest('req_999');
    expect(req).toBeNull();
  });
});

// ── createRequest ────────────────────────────────────────────────────────────

describe('createRequest', () => {
  it('creates a new request with status pending', async () => {
    const created = await createRequest({
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick',
      startDate: '2026-08-01',
      endDate: '2026-08-02',
      days: 2,
      reason: 'Checkup',
    });

    expect(created.status).toBe('pending');
    expect(created.id).toBeDefined();
    expect(created.employeeId).toBe('emp_001');
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('auto-generates a unique UUID for id', async () => {
    const a = await createRequest({
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick',
      startDate: '2026-08-01',
      endDate: '2026-08-01',
      days: 1,
      reason: 'Test',
    });
    // Re-setup mock for second call
    mockReadFile.mockResolvedValue(JSON.stringify(seedData));
    mockWriteFile.mockResolvedValue(undefined);
    const b = await createRequest({
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick',
      startDate: '2026-08-02',
      endDate: '2026-08-02',
      days: 1,
      reason: 'Test 2',
    });
    expect(a.id).not.toBe(b.id);
  });
});

// ── updateRequest ────────────────────────────────────────────────────────────

describe('updateRequest', () => {
  it('updates a request by id', async () => {
    const updated = await updateRequest('req_001', { status: 'approved', decidedBy: 'manager1' });
    expect(updated.status).toBe('approved');
    expect(updated.decidedBy).toBe('manager1');
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('preserves fields that were not updated', async () => {
    const updated = await updateRequest('req_001', { status: 'rejected' });
    expect(updated.employeeId).toBe('emp_001');
    expect(updated.reason).toBe('Vacation');
  });

  it('throws when request id is not found', async () => {
    await expect(updateRequest('req_999', { status: 'approved' })).rejects.toThrow(
      'Request not found',
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
