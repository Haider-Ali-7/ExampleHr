import type { LeaveType } from '@/lib/types';

export function staleKey(employeeId: string, location: string, leaveType: LeaveType): string {
  return `${employeeId}:${location}:${leaveType}`;
}
