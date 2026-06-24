import { type NextRequest, NextResponse } from 'next/server';
import { updateBalance } from '@/lib/hcm';
import { broadcast } from '@/lib/sse';
import type { LeaveType, ApiError } from '@/lib/types';

interface HCMBalancePatchBody {
  employeeId: string;
  location: string;
  leaveType: LeaveType;
  balance: number;
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body: HCMBalancePatchBody = await request.json();
    const { employeeId, location, leaveType, balance } = body;

    if (
      !employeeId ||
      !location ||
      !leaveType ||
      balance == null ||
      typeof balance !== 'number'
    ) {
      return NextResponse.json<ApiError>(
        { error: 'Missing or invalid required fields', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    const updatedBalance = await updateBalance(employeeId, location, leaveType, balance);

    broadcast({
      type: 'hcm_sync',
      payload: updatedBalance,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ balance: updatedBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (message.includes('Balance not found')) {
      return NextResponse.json<ApiError>(
        { error: message, code: 'BALANCE_NOT_FOUND' },
        { status: 404 },
      );
    }

    console.error('[PATCH /api/leave/hcm/balances]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to update HCM balance', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
