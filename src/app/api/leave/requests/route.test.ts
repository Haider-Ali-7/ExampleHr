import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted, so mocks must be created with vi.hoisted.
const { mockReadFile, mockWriteFile, mockBroadcast } = vi.hoisted(() => ({
  mockReadFile: vi.fn<(path: string, encoding: string) => Promise<string>>(),
  mockWriteFile: vi.fn<(path: string, data: string, encoding: string) => Promise<void>>(),
  mockBroadcast: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  default: { readFile: mockReadFile, writeFile: mockWriteFile },
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

vi.mock('@/lib/sse', () => ({
  broadcast: mockBroadcast,
}));

import { NextRequest } from 'next/server';
import { GET, POST } from './route';

// ── seed data ─────────────────────────────────────────────────────────────────

const seedData = {
  users: [],
  balances: [
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'annual',
      balance: 10,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
    {
      employeeId: 'emp_001',
      employeeName: 'John Smith',
      location: 'NY',
      leaveType: 'sick',
      balance: 5,
      lastUpdated: '2026-06-24T08:00:00Z',
    },
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

function makeGetRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/leave/requests');
  for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/leave/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockReadFile.mockReset();
  mockWriteFile.mockReset();
  mockBroadcast.mockReset();
  mockReadFile.mockResolvedValue(JSON.stringify(seedData));
  mockWriteFile.mockResolvedValue(undefined);
});

// ── GET /api/leave/requests ───────────────────────────────────────────────────

describe('GET /api/leave/requests', () => {
  it('returns all requests when no filters are provided', async () => {
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { requests: unknown[] };
    expect(body.requests).toHaveLength(2);
  });

  it('filters by employeeId', async () => {
    const res = await GET(makeGetRequest({ employeeId: 'emp_001' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { requests: Array<{ employeeId: string }> };
    expect(body.requests).toHaveLength(1);
    expect(body.requests[0].employeeId).toBe('emp_001');
  });

  it('filters by status=pending', async () => {
    const res = await GET(makeGetRequest({ status: 'pending' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { requests: Array<{ status: string }> };
    expect(body.requests).toHaveLength(1);
    expect(body.requests[0].status).toBe('pending');
  });

  it('filters by status=approved', async () => {
    const res = await GET(makeGetRequest({ status: 'approved' }));
    const body = (await res.json()) as { requests: Array<{ id: string }> };
    expect(body.requests).toHaveLength(1);
    expect(body.requests[0].id).toBe('req_002');
  });

  it('filters by location', async () => {
    const res = await GET(makeGetRequest({ location: 'NY' }));
    const body = (await res.json()) as { requests: unknown[] };
    expect(body.requests).toHaveLength(2);
  });

  it('returns empty array when no requests match', async () => {
    const res = await GET(makeGetRequest({ employeeId: 'emp_999' }));
    const body = (await res.json()) as { requests: unknown[] };
    expect(body.requests).toHaveLength(0);
  });

  it('returns 500 when file read fails', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('disk error'));
    const res = await GET(makeGetRequest());
    expect(res.status).toBe(500);
    const body = (await res.json()) as { error: string; code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});

// ── POST /api/leave/requests ──────────────────────────────────────────────────

describe('POST /api/leave/requests — valid payload', () => {
  const validPayload = {
    employeeId: 'emp_001',
    employeeName: 'John Smith',
    location: 'NY',
    leaveType: 'sick',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    days: 3,
    reason: 'Medical appointment',
  };

  it('returns 201 with the created request', async () => {
    const res = await POST(makePostRequest(validPayload));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { request: { status: string; employeeId: string } };
    expect(body.request.status).toBe('pending');
    expect(body.request.employeeId).toBe('emp_001');
  });

  it('persists the request by writing the file', async () => {
    await POST(makePostRequest(validPayload));
    expect(mockWriteFile).toHaveBeenCalledOnce();
  });

  it('broadcasts a request_created SSE event', async () => {
    await POST(makePostRequest(validPayload));
    expect(mockBroadcast).toHaveBeenCalledOnce();
    const call = mockBroadcast.mock.calls[0][0] as { type: string };
    expect(call.type).toBe('request_created');
  });

  it('assigns a unique id to the created request', async () => {
    const res = await POST(makePostRequest(validPayload));
    const body = (await res.json()) as { request: { id: string } };
    expect(body.request.id).toBeTruthy();
    expect(typeof body.request.id).toBe('string');
  });
});

// ── POST — missing field validation (root cause of the reported bug) ──────────

describe('POST /api/leave/requests — missing required fields', () => {
  const base = {
    employeeId: 'emp_001',
    employeeName: 'John Smith',
    location: 'NY',
    leaveType: 'annual',
    startDate: '2026-08-01',
    endDate: '2026-08-05',
    days: 5,
    reason: 'Vacation',
  };

  it('returns 400 when employeeId is missing', async () => {
    const { employeeId: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: string; code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toBe('Missing required fields');
  });

  it('returns 400 when employeeName is missing', async () => {
    const { employeeName: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when location is missing', async () => {
    const { location: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when location is an empty string', async () => {
    // This is the primary trigger of the reported bug: form sends location:""
    // when balances have not loaded yet and location state is still ''.
    const res = await POST(makePostRequest({ ...base, location: '' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when leaveType is missing', async () => {
    const { leaveType: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when startDate is missing', async () => {
    const { startDate: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when endDate is missing', async () => {
    const { endDate: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when days is null', async () => {
    const res = await POST(makePostRequest({ ...base, days: null }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when reason is missing', async () => {
    const { reason: _, ...rest } = base;
    const res = await POST(makePostRequest(rest));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when reason is an empty string', async () => {
    const res = await POST(makePostRequest({ ...base, reason: '' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('VALIDATION_ERROR');
  });
});

// ── POST — business rule validation ──────────────────────────────────────────

describe('POST /api/leave/requests — business rule validation', () => {
  it('returns 422 BALANCE_NOT_FOUND when no balance record exists for the combination', async () => {
    const res = await POST(
      makePostRequest({
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'Tokyo',          // no balance for Tokyo
        leaveType: 'annual',
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        days: 3,
        reason: 'Conference',
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('BALANCE_NOT_FOUND');
  });

  it('returns 422 INSUFFICIENT_BALANCE when days requested exceed available balance', async () => {
    // emp_001 NY sick balance is 5; requesting 10 days
    const res = await POST(
      makePostRequest({
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'sick',
        startDate: '2026-08-01',
        endDate: '2026-08-10',
        days: 10,
        reason: 'Extended illness',
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string; available: number };
    expect(body.code).toBe('INSUFFICIENT_BALANCE');
    expect(body.available).toBe(5);
  });

  it('allows a request when days exactly equal the available balance', async () => {
    // emp_001 NY sick balance is 5; requesting exactly 5 days
    const res = await POST(
      makePostRequest({
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'sick',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        days: 5,
        reason: 'Rest',
      }),
    );
    expect(res.status).toBe(201);
  });

  it('returns 500 when an unexpected error occurs', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('unexpected failure'));
    const res = await POST(
      makePostRequest({
        employeeId: 'emp_001',
        employeeName: 'John Smith',
        location: 'NY',
        leaveType: 'annual',
        startDate: '2026-08-01',
        endDate: '2026-08-05',
        days: 5,
        reason: 'Vacation',
      }),
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
