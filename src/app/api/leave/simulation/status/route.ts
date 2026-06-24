import { NextResponse } from 'next/server';
import { getSimulationStatus } from '@/lib/hcm';

export async function GET() {
  const status = await getSimulationStatus();
  return NextResponse.json(status);
}
