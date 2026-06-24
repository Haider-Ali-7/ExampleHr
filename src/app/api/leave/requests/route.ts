import { type NextRequest, NextResponse } from 'next/server';
import { getRequests, getBalance, createRequest, getPendingDays } from '@/lib/hcm';
import { broadcast } from '@/lib/sse';
import type {
  RequestsResponse,
  CreateRequestBody,
  ApiError,
  RequestStatus,
} from '@/lib/types';

const VALID_STATUSES: RequestStatus[] = ['pending', 'approved', 'rejected'];

export async function GET(
  request: NextRequest,
): Promise<NextResponse<RequestsResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId') ?? undefined;
    const rawStatus = searchParams.get('status');
    const status = rawStatus && VALID_STATUSES.includes(rawStatus as RequestStatus)
      ? (rawStatus as RequestStatus)
      : undefined;
    const location = searchParams.get('location') ?? undefined;

    const requests = await getRequests({ employeeId, status, location });

    return NextResponse.json<RequestsResponse>({ requests });
  } catch (err) {
    console.error('[GET /api/leave/requests]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch requests', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  try {
    const body: CreateRequestBody = await request.json();

    const {
      employeeId,
      employeeName,
      location,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
    } = body;

    if (
      !employeeId ||
      !employeeName ||
      !location ||
      !leaveType ||
      !startDate ||
      !endDate ||
      days == null ||
      !reason
    ) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    // Note: balance is NOT deducted at submission (optimistic reservation).
    // Deduction happens only on approval via PATCH /requests/[id].
    // We still validate that the employee has sufficient balance to catch
    // obviously invalid requests early.
    const balance = await getBalance(employeeId, location, leaveType);

    if (!balance) {
      return NextResponse.json<ApiError>(
        {
          error: 'No balance record found for the given employee, location, and leave type',
          code: 'BALANCE_NOT_FOUND',
        },
        { status: 422 },
      );
    }

    const pendingDays = await getPendingDays(employeeId, location, leaveType);
    const availableBalance = balance.balance - pendingDays;

    if (availableBalance < days) {
      return NextResponse.json(
        {
          error: `Insufficient leave balance. Available: ${availableBalance} day${availableBalance === 1 ? '' : 's'} (${balance.balance} total minus ${pendingDays} pending).`,
          code: 'INSUFFICIENT_BALANCE',
          available: availableBalance,
        },
        { status: 422 },
      );
    }

    const newRequest = await createRequest({
      employeeId,
      employeeName,
      location,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
    });

    broadcast({
      type: 'request_created',
      payload: newRequest,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leave/requests]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to create request', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
