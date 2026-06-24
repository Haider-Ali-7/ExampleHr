'use client';

import { useState, useMemo, useEffect } from 'react';
import type { HCMBalance, LeaveType, Location } from '@/lib/types';

export interface LeaveRequestFormProps {
  employeeId: string;
  employeeName: string;
  balances: HCMBalance[];
  onSubmit: (data: {
    location: Location;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
  /** Incremented by the parent hook on every successful submission. The form
   *  resets its controlled fields whenever this value changes. */
  submitCount?: number;
}

const leaveTypeOptions: { value: LeaveType; label: string }[] = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'personal', label: 'Personal Leave' },
];

function computeDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

export function LeaveRequestForm({
  balances,
  onSubmit,
  isSubmitting = false,
  submitError = null,
  submitCount = 0,
}: LeaveRequestFormProps) {
  const locations = useMemo(
    () => Array.from(new Set(balances.map((b) => b.location))).sort(),
    [balances]
  );

  const [location, setLocation] = useState<Location>(locations[0] ?? '');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Sync location when balances load asynchronously after initial render.
  // Without this, location stays '' forever if balances were empty on mount.
  useEffect(() => {
    if (location === '' && locations.length > 0) {
      setLocation(locations[0]);
    }
  }, [location, locations]);

  // Reset form fields after each successful submission. submitCount is
  // incremented by the hook's onSuccess handler; starting at 0 means this
  // effect is a no-op on the initial render.
  useEffect(() => {
    if (submitCount === 0) return;
    setLeaveType('annual');
    setStartDate('');
    setEndDate('');
    setReason('');
    // Location intentionally kept — users commonly file several requests for
    // the same location in one session. The location-sync effect above will
    // re-apply the first available option if the value somehow becomes stale.
  }, [submitCount]);

  const days = useMemo(() => computeDays(startDate, endDate), [startDate, endDate]);

  const currentBalance = useMemo(
    () =>
      balances.find((b) => b.location === location && b.leaveType === leaveType)?.balance ?? null,
    [balances, location, leaveType]
  );

  const isInsufficient = currentBalance !== null && days > 0 && days > currentBalance;

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!location || isInsufficient || days <= 0 || !reason.trim()) return;
    await onSubmit({ location, leaveType, startDate, endDate, days, reason });
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Leave request form"
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-6 flex flex-col gap-5 w-full max-w-lg"
      noValidate
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Request Leave
      </h2>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="leave-location"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Location <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="leave-location"
          required
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="leave-type"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Leave Type <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <select
          id="leave-type"
          required
          value={leaveType}
          onChange={(e) => setLeaveType(e.target.value as LeaveType)}
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {leaveTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {currentBalance !== null && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Available balance:{' '}
            <span className={`font-semibold ${isInsufficient ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {currentBalance} days
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="leave-start"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Start Date <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="leave-start"
            type="date"
            required
            min={today}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (endDate && e.target.value > endDate) setEndDate('');
            }}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="leave-end"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            End Date <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="leave-end"
            type="date"
            required
            min={startDate || today}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {days > 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Duration:{' '}
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {days} {days === 1 ? 'day' : 'days'}
          </span>
        </p>
      )}

      {isInsufficient && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          Insufficient balance. You have {currentBalance} day{currentBalance === 1 ? '' : 's'} available but requested {days}.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="leave-reason"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Reason <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <textarea
          id="leave-reason"
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe the reason for your leave..."
          className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {submitError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !location || isInsufficient || days <= 0 || !reason.trim()}
        aria-disabled={isSubmitting || !location || isInsufficient || days <= 0 || !reason.trim()}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <svg
              aria-hidden="true"
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          'Submit Request'
        )}
      </button>
    </form>
  );
}

export default LeaveRequestForm;
