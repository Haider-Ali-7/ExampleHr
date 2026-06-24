'use client';

import { Toast } from './Toast';
import type { ToastProps } from './Toast';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastProps['type'];
}

export interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const MAX_VISIBLE = 3;

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const visible = toasts.slice(-MAX_VISIBLE);

  if (visible.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 z-50 flex flex-col gap-2 items-center sm:items-end w-[calc(100vw-2rem)] sm:w-auto"
    >
      {visible.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;
