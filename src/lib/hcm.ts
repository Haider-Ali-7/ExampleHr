import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  HCMBalance,
  LeaveRequest,
  LeaveType,
  RequestStatus,
  CreateRequestBody,
  EmployeeConfig,
  YearlyResetConfig,
  SimulationEvent,
  SimulationStatus,
  SimulationEventChange,
} from '@/lib/types';

const DATA_PATH = path.join(process.cwd(), 'src/lib/hcm-data.json');

interface HCMUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  employeeId: string | null;
}

interface HCMData {
  users: HCMUser[];
  balances: HCMBalance[];
  requests: LeaveRequest[];
  employeeConfigs: EmployeeConfig[];
  yearlyReset: YearlyResetConfig;
  simulationEvents: SimulationEvent[];
}

async function readData(): Promise<HCMData> {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(raw) as HCMData;
}

async function writeData(data: HCMData): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getBalances(
  employeeId?: string,
  location?: string,
): Promise<HCMBalance[]> {
  const data = await readData();
  let balances = data.balances;

  if (employeeId) {
    balances = balances.filter((b) => b.employeeId === employeeId);
  }
  if (location) {
    balances = balances.filter((b) => b.location === location);
  }

  return balances;
}

export async function getBalance(
  employeeId: string,
  location: string,
  leaveType: LeaveType,
): Promise<HCMBalance | null> {
  const data = await readData();
  return (
    data.balances.find(
      (b) =>
        b.employeeId === employeeId &&
        b.location === location &&
        b.leaveType === leaveType,
    ) ?? null
  );
}

export async function updateBalance(
  employeeId: string,
  location: string,
  leaveType: LeaveType,
  newBalance: number,
): Promise<HCMBalance> {
  const data = await readData();
  const index = data.balances.findIndex(
    (b) =>
      b.employeeId === employeeId &&
      b.location === location &&
      b.leaveType === leaveType,
  );

  if (index === -1) {
    throw new Error(
      `Balance not found for employeeId=${employeeId}, location=${location}, leaveType=${leaveType}`,
    );
  }

  data.balances[index] = {
    ...data.balances[index],
    balance: newBalance,
    lastUpdated: new Date().toISOString(),
  };

  await writeData(data);
  return data.balances[index];
}

export async function getRequests(filters?: {
  employeeId?: string;
  status?: RequestStatus;
  location?: string;
}): Promise<LeaveRequest[]> {
  const data = await readData();
  let requests = data.requests;

  if (filters?.employeeId) {
    requests = requests.filter((r) => r.employeeId === filters.employeeId);
  }
  if (filters?.status) {
    requests = requests.filter((r) => r.status === filters.status);
  }
  if (filters?.location) {
    requests = requests.filter((r) => r.location === filters.location);
  }

  return requests;
}

export async function getRequest(id: string): Promise<LeaveRequest | null> {
  const data = await readData();
  return data.requests.find((r) => r.id === id) ?? null;
}

export async function createRequest(
  requestData: CreateRequestBody,
): Promise<LeaveRequest> {
  const data = await readData();

  const newRequest: LeaveRequest = {
    id: crypto.randomUUID(),
    employeeId: requestData.employeeId,
    employeeName: requestData.employeeName,
    location: requestData.location,
    leaveType: requestData.leaveType,
    startDate: requestData.startDate,
    endDate: requestData.endDate,
    days: requestData.days,
    reason: requestData.reason,
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };

  data.requests.push(newRequest);
  await writeData(data);
  return newRequest;
}

export async function getPendingDays(
  employeeId: string,
  location: string,
  leaveType: LeaveType,
): Promise<number> {
  const data = await readData();
  return data.requests
    .filter(
      (r) =>
        r.employeeId === employeeId &&
        r.location === location &&
        r.leaveType === leaveType &&
        r.status === 'pending',
    )
    .reduce((sum, r) => sum + r.days, 0);
}

export async function updateRequest(
  id: string,
  updates: Partial<LeaveRequest>,
): Promise<LeaveRequest> {
  const data = await readData();
  const index = data.requests.findIndex((r) => r.id === id);

  if (index === -1) {
    throw new Error(`Request not found: id=${id}`);
  }

  data.requests[index] = {
    ...data.requests[index],
    ...updates,
  };

  await writeData(data);
  return data.requests[index];
}

// ============ Simulation Functions ============

function getThisYearAnniversary(hireDate: string, today: Date): Date {
  const hire = new Date(hireDate);
  const anniversary = new Date(today.getFullYear(), hire.getMonth(), hire.getDate());
  return anniversary;
}

function getLastResetDate(config: YearlyResetConfig, today: Date): Date {
  if (config.resetType === 'calendar') {
    return new Date(today.getFullYear(), 0, 1);
  }
  const { month, day } = config.fiscalMonthDay ?? { month: 1, day: 1 };
  let resetDate = new Date(today.getFullYear(), month - 1, day);
  if (resetDate > today) {
    resetDate = new Date(today.getFullYear() - 1, month - 1, day);
  }
  return resetDate;
}

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function getSimulationConfig(): Promise<{
  employeeConfigs: EmployeeConfig[];
  yearlyReset: YearlyResetConfig;
}> {
  const data = await readData();
  return {
    employeeConfigs: data.employeeConfigs,
    yearlyReset: data.yearlyReset,
  };
}

export async function checkAndApplySimulation(): Promise<SimulationEvent[]> {
  const data = await readData();
  const today = new Date();
  const appliedEvents: SimulationEvent[] = [];

  const userMap = new Map(data.users.filter((u) => u.employeeId).map((u) => [u.employeeId, u.name]));

  for (let i = 0; i < data.employeeConfigs.length; i++) {
    const config = data.employeeConfigs[i];
    const anniversaryThisYear = getThisYearAnniversary(config.hireDate, today);
    const anniversaryStr = toDateString(anniversaryThisYear);

    if (anniversaryThisYear <= today) {
      const lastCredited = config.lastAnniversaryCredited;
      if (!lastCredited || lastCredited < anniversaryStr) {
        const employeeName = userMap.get(config.employeeId) ?? config.employeeId;
        const changes: SimulationEventChange[] = [];

        const employeeBalances = data.balances.filter((b) => b.employeeId === config.employeeId);
        const locations = [...new Set(employeeBalances.map((b) => b.location))];

        for (const credit of config.anniversaryCredits) {
          for (const location of locations) {
            const balanceIdx = data.balances.findIndex(
              (b) =>
                b.employeeId === config.employeeId &&
                b.location === location &&
                b.leaveType === credit.leaveType,
            );
            if (balanceIdx !== -1) {
              const oldBalance = data.balances[balanceIdx].balance;
              const newBalance = oldBalance + credit.creditsPerYear;
              data.balances[balanceIdx].balance = newBalance;
              data.balances[balanceIdx].lastUpdated = new Date().toISOString();

              changes.push({
                location,
                leaveType: credit.leaveType,
                delta: credit.creditsPerYear,
                newBalance,
              });
            }
          }
        }

        if (changes.length > 0) {
          const event: SimulationEvent = {
            id: crypto.randomUUID(),
            type: 'anniversary_credit',
            employeeId: config.employeeId,
            employeeName,
            dueDate: anniversaryStr,
            appliedAt: new Date().toISOString(),
            changes,
          };
          appliedEvents.push(event);
          data.simulationEvents.push(event);
        }

        data.employeeConfigs[i].lastAnniversaryCredited = anniversaryStr;
      }
    }
  }

  const lastResetDate = getLastResetDate(data.yearlyReset, today);
  const lastResetStr = toDateString(lastResetDate);
  const configLastReset = data.yearlyReset.lastResetDate;

  if (!configLastReset || configLastReset < lastResetStr) {
    const resetAmounts: Record<LeaveType, number> = {
      annual: data.yearlyReset.annualReset,
      sick: data.yearlyReset.sickReset,
      personal: data.yearlyReset.personalReset,
    };

    const employeeIds = [...new Set(data.balances.map((b) => b.employeeId))];

    for (const employeeId of employeeIds) {
      const employeeName = userMap.get(employeeId) ?? employeeId;
      const changes: SimulationEventChange[] = [];

      for (let i = 0; i < data.balances.length; i++) {
        const balance = data.balances[i];
        if (balance.employeeId === employeeId) {
          const bonusAmount = resetAmounts[balance.leaveType];
          const newBalance = balance.balance + bonusAmount;
          data.balances[i].balance = newBalance;
          data.balances[i].lastUpdated = new Date().toISOString();

          changes.push({
            location: balance.location,
            leaveType: balance.leaveType,
            delta: bonusAmount,
            newBalance,
          });
        }
      }

      if (changes.length > 0) {
        const event: SimulationEvent = {
          id: crypto.randomUUID(),
          type: 'yearly_reset',
          employeeId,
          employeeName,
          dueDate: lastResetStr,
          appliedAt: new Date().toISOString(),
          changes,
        };
        appliedEvents.push(event);
        data.simulationEvents.push(event);
      }
    }

    data.yearlyReset.lastResetDate = lastResetStr;
  }

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
  data.simulationEvents = data.simulationEvents.filter(
    (e) => e.appliedAt && new Date(e.appliedAt) >= thirtyDaysAgo,
  );

  await writeData(data);
  return appliedEvents;
}

export async function getSimulationStatus(): Promise<SimulationStatus> {
  const data = await readData();
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentEvents = data.simulationEvents
    .filter((e) => e.appliedAt && new Date(e.appliedAt) >= thirtyDaysAgo)
    .sort((a, b) => (b.appliedAt ?? '').localeCompare(a.appliedAt ?? ''));

  return {
    employeeConfigs: data.employeeConfigs,
    yearlyReset: data.yearlyReset,
    recentEvents,
    pendingEvents: [],
  };
}

export async function applyManualAnniversaryCredit(employeeId: string): Promise<SimulationEvent | null> {
  const data = await readData();
  const configIndex = data.employeeConfigs.findIndex((c) => c.employeeId === employeeId);
  if (configIndex === -1) return null;

  const config = data.employeeConfigs[configIndex];
  const userMap = new Map(data.users.filter((u) => u.employeeId).map((u) => [u.employeeId, u.name]));
  const employeeName = userMap.get(employeeId) ?? employeeId;
  const changes: SimulationEventChange[] = [];

  const employeeBalances = data.balances.filter((b) => b.employeeId === employeeId);
  const locations = [...new Set(employeeBalances.map((b) => b.location))];

  for (const credit of config.anniversaryCredits) {
    for (const location of locations) {
      const balanceIdx = data.balances.findIndex(
        (b) =>
          b.employeeId === employeeId &&
          b.location === location &&
          b.leaveType === credit.leaveType,
      );
      if (balanceIdx !== -1) {
        const oldBalance = data.balances[balanceIdx].balance;
        const newBalance = oldBalance + credit.creditsPerYear;
        data.balances[balanceIdx].balance = newBalance;
        data.balances[balanceIdx].lastUpdated = new Date().toISOString();

        changes.push({
          location,
          leaveType: credit.leaveType,
          delta: credit.creditsPerYear,
          newBalance,
        });
      }
    }
  }

  if (changes.length === 0) return null;

  const event: SimulationEvent = {
    id: crypto.randomUUID(),
    type: 'anniversary_credit',
    employeeId,
    employeeName,
    dueDate: toDateString(new Date()),
    appliedAt: new Date().toISOString(),
    changes,
  };

  data.simulationEvents.push(event);
  data.employeeConfigs[configIndex].lastAnniversaryCredited = toDateString(new Date());

  await writeData(data);
  return event;
}

export async function applyManualYearlyReset(): Promise<SimulationEvent[]> {
  const data = await readData();
  const appliedEvents: SimulationEvent[] = [];

  const userMap = new Map(data.users.filter((u) => u.employeeId).map((u) => [u.employeeId, u.name]));

  const resetAmounts: Record<LeaveType, number> = {
    annual: data.yearlyReset.annualReset,
    sick: data.yearlyReset.sickReset,
    personal: data.yearlyReset.personalReset,
  };

  const employeeIds = [...new Set(data.balances.map((b) => b.employeeId))];

  for (const employeeId of employeeIds) {
    const employeeName = userMap.get(employeeId) ?? employeeId;
    const changes: SimulationEventChange[] = [];

    for (let i = 0; i < data.balances.length; i++) {
      const balance = data.balances[i];
      if (balance.employeeId === employeeId) {
        const bonusAmount = resetAmounts[balance.leaveType];
        const newBalance = balance.balance + bonusAmount;
        data.balances[i].balance = newBalance;
        data.balances[i].lastUpdated = new Date().toISOString();

        changes.push({
          location: balance.location,
          leaveType: balance.leaveType,
          delta: bonusAmount,
          newBalance,
        });
      }
    }

    if (changes.length > 0) {
      const event: SimulationEvent = {
        id: crypto.randomUUID(),
        type: 'yearly_reset',
        employeeId,
        employeeName,
        dueDate: toDateString(new Date()),
        appliedAt: new Date().toISOString(),
        changes,
      };
      appliedEvents.push(event);
      data.simulationEvents.push(event);
    }
  }

  data.yearlyReset.lastResetDate = toDateString(new Date());

  await writeData(data);
  return appliedEvents;
}
