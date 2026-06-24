export type LeaveType = 'annual' | 'sick' | 'personal';
export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  employeeId: string | null;
}
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type Location = string;

export interface HCMBalance {
  employeeId: string;
  employeeName: string;
  location: Location;
  leaveType: LeaveType;
  balance: number;
  lastUpdated: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  location: Location;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: RequestStatus;
  submittedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  managerNote?: string;
  balanceAtDecision?: number;
}

export interface LeaveEvent {
  id: string;
  type: 'balance_updated' | 'request_created' | 'request_decided' | 'hcm_sync' | 'anniversary_credited' | 'yearly_reset_applied';
  payload: HCMBalance | LeaveRequest | { employeeId: string; location: Location } | SimulationEvent;
  timestamp: string;
}

export interface BalanceResponse {
  balances: HCMBalance[];
  fetchedAt: string;
}

export interface RequestsResponse {
  requests: LeaveRequest[];
}

export interface CreateRequestBody {
  employeeId: string;
  employeeName: string;
  location: Location;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export interface DecideRequestBody {
  status: 'approved' | 'rejected';
  managerNote?: string;
  decidedBy: string;
}

export interface ApiError {
  error: string;
  code: string;
}

// Simulation types for anniversary/yearly leave balance management
export interface AnniversaryCredit {
  leaveType: LeaveType;
  creditsPerYear: number;
}

export interface EmployeeConfig {
  employeeId: string;
  hireDate: string;
  anniversaryCredits: AnniversaryCredit[];
  lastAnniversaryCredited: string | null;
}

export interface YearlyResetConfig {
  resetType: 'calendar' | 'fiscal';
  fiscalMonthDay?: { month: number; day: number };
  annualReset: number;
  sickReset: number;
  personalReset: number;
  lastResetDate: string | null;
}

export interface SimulationEventChange {
  location: string;
  leaveType: LeaveType;
  delta: number;
  newBalance: number;
}

export interface SimulationEvent {
  id: string;
  type: 'anniversary_credit' | 'yearly_reset';
  employeeId: string;
  employeeName: string;
  dueDate: string;
  appliedAt: string | null;
  changes: SimulationEventChange[];
}

export interface SimulationStatus {
  employeeConfigs: EmployeeConfig[];
  yearlyReset: YearlyResetConfig;
  recentEvents: SimulationEvent[];
  pendingEvents: SimulationEvent[];
}
