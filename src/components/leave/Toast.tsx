'use client';

import { useEffect, useRef, useState } from 'react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onDismiss: () => void;
  autoDismissMs?: number;
}

const typeConfig: Record<
  ToastProps['type'],
  { className: string; iconPath: string; label: string }
> = {
  success: {
    className:
      'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950 dark:border-emerald-700 dark:text-emerald-100',
    iconPath: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    label: 'Success',
  },
  error: {
    className:
      'bg-red-50 border-red-200 text-red-900 dark:bg-red-950 dark:border-red-700 dark:text-red-100',
    iconPath:
      'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
    label: 'Error',
  },
  info: {
    className:
      'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-100',
    iconPath:
      'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z',
    label: 'Info',
  },
  warning: {
    className:
      'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-700 dark:text-amber-100',
    iconPath:
      'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z',
    label: 'Warning',
  },
};

export function Toast({ message, type, onDismiss, autoDismissMs = 5000 }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const config = typeConfig[type];
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showTimer = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(showTimer);
  }, []);

  useEffect(() => {
    if (autoDismissMs === 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      dismissTimerRef.current = setTimeout(onDismiss, 300);
    }, autoDismissMs);
    return () => {
      clearTimeout(timer);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    dismissTimerRef.current = setTimeout(onDismiss, 300);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      aria-label={`${config.label}: ${message}`}
      className={`
        flex items-start gap-3 w-full max-w-sm rounded-xl border shadow-sm px-4 py-3
        transition-all duration-300 ease-out
        ${config.className}
        ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
      `}
    >
      <svg
        aria-hidden="true"
        className="w-5 h-5 flex-shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={config.iconPath} />
      </svg>
      <p className="flex-1 text-sm font-medium leading-5">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={handleDismiss}
        className="flex-shrink-0 -mr-1 -mt-0.5 rounded p-1 opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-current"
      >
        <svg aria-hidden="true" className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
