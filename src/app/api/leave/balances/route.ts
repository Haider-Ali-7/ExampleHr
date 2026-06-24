import { type NextRequest, NextResponse } from 'next/server';
import { getBalances } from '@/lib/hcm';
import type { BalanceResponse, ApiError } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<BalanceResponse | ApiError>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId') ?? undefined;
    const location = searchParams.get('location') ?? undefined;

    const balances = await getBalances(employeeId, location);

    return NextResponse.json<BalanceResponse>({
      balances,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[GET /api/leave/balances]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch balances', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
