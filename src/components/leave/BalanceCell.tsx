"use client";

import { useState, useRef, useEffect } from "react";
import type { LeaveType } from "@/lib/types";

export interface BalanceCellProps {
  employeeId: string;
  location: string;
  leaveType: LeaveType;
  balance: number | null;
  isStale?: boolean;
  onSave: (newBalance: number) => Promise<void>;
}

type CellState = "read" | "editing" | "saving" | "error";

export function BalanceCell({
  balance,
  isStale = false,
  onSave,
}: BalanceCellProps) {
  const [cellState, setCellState] = useState<CellState>("read");
  const [inputValue, setInputValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cellState === "editing") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [cellState]);

  const enterEdit = () => {
    setInputValue(balance?.toString() ?? "0");
    setErrorMessage("");
    setCellState("editing");
  };

  const cancelEdit = () => {
    setCellState("read");
    setErrorMessage("");
  };

  const handleSave = async () => {
    const parsed = Number(inputValue);
    if (isNaN(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
      setErrorMessage("Enter a whole number ≥ 0");
      setCellState("error");
      return;
    }

    setCellState("saving");
    setErrorMessage("");

    try {
      await onSave(parsed);
      setCellState("read");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Save failed");
      setCellState("error");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSave();
    if (e.key === "Escape") cancelEdit();
  };

  if (cellState === "read") {
    return (
      <button
        onClick={enterEdit}
        aria-label="Click to edit"
        title="Click to edit"
        className="group relative flex items-center justify-center w-full min-h-8 rounded px-2 py-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        {isStale && (
          <span
            aria-label="May be outdated"
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-400 dark:bg-amber-500"
          />
        )}
        <span>{balance ?? "—"}</span>
        <span
          aria-hidden="true"
          className="ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 dark:text-zinc-500"
        >
          ✎
        </span>
      </button>
    );
  }

  if (cellState === "saving") {
    return (
      <div className="flex items-center justify-center w-full min-h-8 px-2 py-1">
        <svg
          aria-label="Saving"
          className="w-4 h-4 animate-spin text-zinc-400"
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
      </div>
    );
  }

  const isError = cellState === "error";

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="1"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (isError) setCellState("editing");
          }}
          onKeyDown={handleKeyDown}
          aria-label="Edit balance"
          aria-invalid={isError}
          className={`w-16 rounded border px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 ${
            isError
              ? "border-red-500 focus:ring-red-400"
              : "border-zinc-300 dark:border-zinc-600 focus:ring-zinc-400 dark:focus:ring-zinc-500"
          }`}
        />
        <button
          onClick={() => void handleSave()}
          aria-label="Save"
          className="p-1 rounded text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button
          onClick={cancelEdit}
          aria-label="Cancel"
          className="p-1 rounded text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {isError && errorMessage && (
        <p role="alert" className="text-xs text-red-500 dark:text-red-400 px-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

export default BalanceCell;
