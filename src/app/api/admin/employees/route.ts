import { NextResponse } from 'next/server';
import { getBalances } from '@/lib/hcm';
import type { ApiError } from '@/lib/types';

export interface EmployeeWithBalances {
  id: string;
  name: string;
  email: string;
  balances: {
    location: string;
    annual: number | null;
    sick: number | null;
    personal: number | null;
  }[];
}

interface HCMUser {
  id: string;
  email: string;
  name: string;
  role: string;
  employeeId: string | null;
}

interface HCMDataJson {
  users: HCMUser[];
}

async function getEmployeeUsers(): Promise<HCMUser[]> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const dataPath = path.join(process.cwd(), 'src/lib/hcm-data.json');
  const raw = await fs.readFile(dataPath, 'utf-8');
  const data = JSON.parse(raw) as HCMDataJson;
  return data.users.filter((u) => u.role === 'employee' && u.employeeId !== null);
}

export async function GET(): Promise<NextResponse> {
  try {
    const [employees, allBalances] = await Promise.all([
      getEmployeeUsers(),
      getBalances(),
    ]);

    const result: EmployeeWithBalances[] = employees.map((emp) => {
      const empBalances = allBalances.filter((b) => b.employeeId === emp.employeeId);

      const locationMap = new Map<
        string,
        { annual: number | null; sick: number | null; personal: number | null }
      >();

      for (const b of empBalances) {
        const existing = locationMap.get(b.location) ?? {
          annual: null,
          sick: null,
          personal: null,
        };
        if (b.leaveType === 'annual' || b.leaveType === 'sick' || b.leaveType === 'personal') {
          existing[b.leaveType] = b.balance;
        }
        locationMap.set(b.location, existing);
      }

      return {
        id: emp.employeeId as string,
        name: emp.name,
        email: emp.email,
        balances: Array.from(locationMap.entries()).map(([location, types]) => ({
          location,
          ...types,
        })),
      };
    });

    return NextResponse.json({ employees: result });
  } catch (err) {
    console.error('[GET /api/admin/employees]', err);
    return NextResponse.json<ApiError>(
      { error: 'Failed to fetch employees', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
