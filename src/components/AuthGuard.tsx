'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/lib/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole: UserRole | UserRole[];
}

const roleHomePath: Record<UserRole, string> = {
  employee: '/employee',
  manager: '/manager',
  admin: '/admin',
};

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const allowedRoles = useMemo(
    () => (Array.isArray(requiredRole) ? requiredRole : [requiredRole]),
    [requiredRole]
  );

  const hasAccess = user && allowedRoles.includes(user.role);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(roleHomePath[user.role]);
    }
  }, [user, allowedRoles, router]);

  if (!hasAccess) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-zinc-300 border-t-zinc-700 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return <>{children}</>;
}
