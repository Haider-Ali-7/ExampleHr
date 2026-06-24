import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            HR Leave Management
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">
            Manage employee leave requests and balances
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/employee"
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm text-left transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xl">
                &#128100;
              </span>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Employee View
              </h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Check your leave balances, submit new leave requests, and track
              the status of your pending and past requests in real time.
            </p>
            <span className="mt-auto text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              Go to Employee Dashboard &rarr;
            </span>
          </Link>
          <Link
            href="/manager"
            className="group flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-sm text-left transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xl">
                &#128203;
              </span>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Manager View
              </h2>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Review and decide on pending leave requests from your team,
              view decided requests, and simulate HCM balance updates for
              demo purposes.
            </p>
            <span className="mt-auto text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
              Go to Manager Dashboard &rarr;
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
