import { type NextRequest, NextResponse } from 'next/server';
import { getRequest, updateRequest, getBalance, updateBalance, getPendingDays } from '@/lib/hcm';
import { broadcast } from '@/lib/sse';
import type { DecideRequestBody, ApiError } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leaveRequest = await getRequest(id);

    if (!leaveRequest) {
      return NextResponse.json<ApiError>(
        { error: 'Request not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    return NextResponse.json({ request: leaveRequest });
  } catch (err) {
    console.error('[GET /api/leave/requests/[id]]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch request', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body: DecideRequestBody = await request.json();
    const { status, managerNote, decidedBy } = body;

    if (!status || !decidedBy) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields: status, decidedBy', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json<ApiError>(
        { error: 'Invalid status. Must be "approved" or "rejected"', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const leaveRequest = await getRequest(id);

    if (!leaveRequest) {
      return NextResponse.json<ApiError>(
        { error: 'Request not found', code: 'NOT_FOUND' },
        { status: 404 },
      );
    }

    if (leaveRequest.status !== 'pending') {
      return NextResponse.json<ApiError>(
        {
          error: `Request has already been decided (status: ${leaveRequest.status})`,
          code: 'ALREADY_DECIDED',
        },
        { status: 409 },
      );
    }

    // Fetch the current balance snapshot for context
    const currentBalance = await getBalance(
      leaveRequest.employeeId,
      leaveRequest.location,
      leaveRequest.leaveType,
    );

    const balanceAtDecision = currentBalance?.balance ?? null;

    const decidedAt = new Date().toISOString();

    let updatedBalance: Awaited<ReturnType<typeof updateBalance>> | null = null;

    if (status === 'approved') {
      // Deduct balance only on approval
      if (!currentBalance) {
        return NextResponse.json<ApiError>(
          {
            error: 'Balance record not found for this request',
            code: 'BALANCE_NOT_FOUND',
          },
          { status: 422 },
        );
      }

      // Account for other pending requests (excluding the current one being approved)
      const otherPendingDays = await getPendingDays(
        leaveRequest.employeeId,
        leaveRequest.location,
        leaveRequest.leaveType,
      ) - leaveRequest.days;

      const availableBalance = currentBalance.balance - Math.max(0, otherPendingDays);

      if (availableBalance < leaveRequest.days) {
        return NextResponse.json(
          {
            error: `Insufficient leave balance to approve this request. Available: ${availableBalance} day${availableBalance === 1 ? '' : 's'} (${currentBalance.balance} total minus ${otherPendingDays} pending from other requests).`,
            code: 'INSUFFICIENT_BALANCE',
            available: availableBalance,
          },
          { status: 422 },
        );
      }

      updatedBalance = await updateBalance(
        leaveRequest.employeeId,
        leaveRequest.location,
        leaveRequest.leaveType,
        currentBalance.balance - leaveRequest.days,
      );
    }

    // On rejection: no balance change, just update request status

    const updatedRequest = await updateRequest(id, {
      status,
      decidedAt,
      decidedBy,
      ...(managerNote !== undefined ? { managerNote } : {}),
      ...(balanceAtDecision !== null ? { balanceAtDecision } : {}),
    });

    const now = new Date().toISOString();

    // Broadcast the decision so all clients (employee, manager, admin) update
    // their request lists.
    broadcast({
      type: 'request_decided',
      payload: updatedRequest,
      timestamp: now,
    });

    // On approval, also broadcast balance_updated so that the admin dashboard
    // (which only listens for balance_updated / hcm_sync) reflects the
    // decremented balance immediately without waiting for a manual refresh.
    if (updatedBalance) {
      broadcast({
        type: 'balance_updated',
        payload: updatedBalance,
        timestamp: now,
      });
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (err) {
    console.error('[PATCH /api/leave/requests/[id]]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to decide request', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
