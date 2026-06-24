'use client';

import { useState } from 'react';
import type { LeaveRequest } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

export interface RequestCardProps {
  request: LeaveRequest;
  optimisticStatus?: 'pending' | 'rolled-back';
  isManager?: boolean;
  currentBalance?: number;
  onApprove?: (id: string) => Promise<void>;
  onReject?: (id: string, note: string) => Promise<void>;
  isDeciding?: boolean;
  isBalanceStale?: boolean;
}

const leaveTypeLabel: Record<LeaveRequest['leaveType'], string> = {
  annual: 'Annual',
  sick: 'Sick',
  personal: 'Personal',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RequestCard({
  request,
  optimisticStatus,
  isManager = false,
  currentBalance,
  onApprove,
  onReject,
  isDeciding = false,
  isBalanceStale = false,
}: RequestCardProps) {
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const showManagerActions =
    isManager && request.status === 'pending' && !optimisticStatus;

  const handleApprove = async () => {
    if (!onApprove || isDeciding) return;
    await onApprove(request.id);
  };

  const handleReject = async () => {
    if (!onReject || isDeciding) return;
    await onReject(request.id, rejectNote);
    setRejectNote('');
    setShowRejectInput(false);
  };

  const badgeStatus =
    optimisticStatus === 'pending'
      ? 'optimistic-pending'
      : request.status;

  return (
    <article
      aria-label={`Leave request from ${request.employeeName}`}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-5 flex flex-col gap-4"
    >
      {optimisticStatus === 'rolled-back' && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-700 dark:text-red-300"
        >
          <svg
            aria-hidden="true"
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          This request could not be submitted.
        </div>
      )}

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {request.employeeName}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{request.location}</p>
        </div>
        <StatusBadge status={badgeStatus} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Leave type</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {leaveTypeLabel[request.leaveType]}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Duration</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {request.days} {request.days === 1 ? 'day' : 'days'}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Start date</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatDate(request.startDate)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">End date</dt>
          <dd className="font-medium text-zinc-900 dark:text-zinc-100">
            {formatDate(request.endDate)}
          </dd>
        </div>
        {isManager && currentBalance !== undefined && (
          <div className="col-span-2">
            <dt className="text-zinc-500 dark:text-zinc-400">Current balance</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              {currentBalance} days
              {isBalanceStale && (
                <span
                  title="Balance may be outdated"
                  className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />
                  May be outdated
                </span>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Reason</p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {request.reason}
        </p>
      </div>

      {request.managerNote && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Manager note</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{request.managerNote}</p>
        </div>
      )}

      {showManagerActions && (
        <div className="flex flex-col gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {showRejectInput && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`reject-note-${request.id}`}
                className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                Rejection reason
              </label>
              <textarea
                id={`reject-note-${request.id}`}
                rows={2}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Optional: explain the rejection..."
                className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleApprove}
              disabled={isDeciding}
              aria-disabled={isDeciding}
              className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 inline-flex items-center gap-2"
            >
              {isDeciding && (
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
              )}
              Approve
            </button>
            {showRejectInput ? (
              <>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isDeciding}
                  aria-disabled={isDeciding}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Confirm Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectInput(false);
                    setRejectNote('');
                  }}
                  disabled={isDeciding}
                  className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                disabled={isDeciding}
                aria-disabled={isDeciding}
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Reject
              </button>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Submitted {formatDate(request.submittedAt)}
        {request.decidedAt && ` · Decided ${formatDate(request.decidedAt)}`}
        {request.decidedBy && ` by ${request.decidedBy}`}
      </p>
    </article>
  );
}

export default RequestCard;
