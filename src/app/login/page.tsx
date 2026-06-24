'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/leave/LoginForm';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/lib/types';

const roleHomePath: Record<UserRole, string> = {
  employee: '/employee',
  manager: '/manager',
  admin: '/admin',
};

export default function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const clearError = useAuthStore((s) => s.clearError);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(roleHomePath[user.role]);
    }
  }, [user, router]);

  async function handleSubmit(email: string, password: string) {
    clearError();
    try {
      await login(email, password);
    } catch {
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign in to HR Leave
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter your credentials to continue
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-6">
          <LoginForm
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
            error={error}
          />
        </div>

        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Demo credentials (password: 123456)
          </p>
          <ul className="space-y-1">
            {[
              { label: 'Employee', email: 'employee1@gmail.com' },
              { label: 'Manager', email: 'manager1@gmail.com' },
              { label: 'Admin',   email: 'admin1@gmail.com' },
            ].map(({ label, email }) => (
              <li key={email} className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium w-16">{label}:</span>
                <code className="font-mono text-zinc-700 dark:text-zinc-300">{email}</code>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
