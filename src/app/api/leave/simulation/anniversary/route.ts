import { NextResponse } from 'next/server';
import { applyManualAnniversaryCredit } from '@/lib/hcm';
import { broadcast } from '@/lib/sse';

export async function POST(request: Request) {
  const body = await request.json();
  const { employeeId } = body;

  if (!employeeId) {
    return NextResponse.json({ error: 'employeeId is required' }, { status: 400 });
  }

  const event = await applyManualAnniversaryCredit(employeeId);

  if (!event) {
    return NextResponse.json({ error: 'Employee not found or no credits configured' }, { status: 404 });
  }

  broadcast({
    type: 'anniversary_credited',
    payload: event,
    timestamp: event.appliedAt ?? new Date().toISOString(),
  });

  for (const change of event.changes) {
    broadcast({
      type: 'hcm_sync',
      payload: {
        employeeId: event.employeeId,
        employeeName: event.employeeName,
        location: change.location,
        leaveType: change.leaveType,
        balance: change.newBalance,
        lastUpdated: event.appliedAt ?? new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  return NextResponse.json({ applied: event });
}
