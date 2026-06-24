import { NextResponse } from 'next/server';
import { applyManualYearlyReset } from '@/lib/hcm';
import { broadcast } from '@/lib/sse';

export async function POST() {
  const applied = await applyManualYearlyReset();

  for (const event of applied) {
    broadcast({
      type: 'yearly_reset_applied',
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
  }

  return NextResponse.json({ applied });
}
