'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const navLinkClass =
  'shrink-0 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors';

export function NavBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center gap-6 h-14 overflow-x-auto">
          <Link
            href="/"
            className="shrink-0 text-base font-semibold text-zinc-900 dark:text-zinc-100 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            HR Leave
          </Link>

          {user && (
            <div className="flex items-center gap-1">
              {user.role === 'employee' && (
                <Link href="/employee" className={navLinkClass}>
                  My Leave
                </Link>
              )}
              {user.role === 'manager' && (
                <Link href="/manager" className={navLinkClass}>
                  Leave Requests
                </Link>
              )}
              {user.role === 'admin' && (
                <>
                  <Link href="/admin" className={navLinkClass}>
                    Admin
                  </Link>
                  <Link href="/manager" className={navLinkClass}>
                    Manager View
                  </Link>
                </>
              )}
            </div>
          )}

          <div className="ml-auto flex items-center gap-3 shrink-0">
            {user ? (
              <>
                <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
