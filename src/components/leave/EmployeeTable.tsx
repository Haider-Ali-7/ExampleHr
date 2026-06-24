"use client";

import type { LeaveType } from "@/lib/types";
import { BalanceCell } from "@/components/leave/BalanceCell";
import { staleKey } from "@/lib/staleKey";
import type { EmployeeWithBalances } from "@/app/api/admin/employees/route";

export interface EmployeeTableProps {
  employees: EmployeeWithBalances[];
  isLoading?: boolean;
  staleCells?: Set<string>;
  onUpdateBalance: (
    employeeId: string,
    location: string,
    leaveType: LeaveType,
    newBalance: number
  ) => Promise<void>;
}

const LEAVE_TYPES: LeaveType[] = ["annual", "sick", "personal"];

const leaveTypeLabel: Record<LeaveType, string> = {
  annual: "Annual",
  sick: "Sick",
  personal: "Personal",
};

function SkeletonRow() {
  return (
    <tr aria-hidden="true" className="animate-pulse">
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-32" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-24" />
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-16" />
      </td>
      {[0, 1, 2].map((i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-10 mx-auto" />
        </td>
      ))}
    </tr>
  );
}

interface EmployeeRowProps {
  employee: EmployeeWithBalances;
  staleCells: Set<string>;
  onUpdateBalance: EmployeeTableProps["onUpdateBalance"];
}

function EmployeeRow({ employee, staleCells, onUpdateBalance }: EmployeeRowProps) {
  const rows = employee.balances.length > 0 ? employee.balances : [{ location: "—", annual: null, sick: null, personal: null }];

  return (
    <>
      {rows.map((balRow, idx) => (
        <tr
          key={`${employee.id}-${balRow.location}`}
          className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          {idx === 0 && (
            <td
              rowSpan={rows.length}
              className="px-4 py-3 align-top border-r border-zinc-100 dark:border-zinc-800"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {employee.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {employee.email}
                </span>
              </div>
            </td>
          )}
          <td className="px-4 py-3">
            <span className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
              {balRow.location}
            </span>
          </td>
          {LEAVE_TYPES.map((lt) => (
            <td key={lt} className="px-2 py-2 text-center">
              {balRow.location === "—" ? (
                <span className="text-xs text-zinc-400 dark:text-zinc-600">—</span>
              ) : (
                <BalanceCell
                  employeeId={employee.id}
                  location={balRow.location}
                  leaveType={lt}
                  balance={balRow[lt]}
                  isStale={staleCells.has(staleKey(employee.id, balRow.location, lt))}
                  onSave={(newBalance) =>
                    onUpdateBalance(employee.id, balRow.location, lt, newBalance)
                  }
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmployeeTable({
  employees,
  isLoading = false,
  staleCells = new Set(),
  onUpdateBalance,
}: EmployeeTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <table className="w-full min-w-[640px] border-collapse bg-white dark:bg-zinc-900">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60">
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 border-r border-zinc-200 dark:border-zinc-700"
            >
              Employee
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
            >
              Location
            </th>
            {LEAVE_TYPES.map((lt) => (
              <th
                key={lt}
                scope="col"
                className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                {leaveTypeLabel[lt]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : employees.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-16 text-center text-sm text-zinc-500 dark:text-zinc-400"
              >
                <div className="flex flex-col items-center gap-3">
                  <svg
                    aria-hidden="true"
                    className="w-10 h-10 opacity-30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0"
                    />
                  </svg>
                  <span className="font-medium">No employees found</span>
                </div>
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                employee={emp}
                staleCells={staleCells}
                onUpdateBalance={onUpdateBalance}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeTable;
