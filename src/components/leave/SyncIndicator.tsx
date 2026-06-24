export interface SyncIndicatorProps {
  lastSync: string | null;
  isSyncing?: boolean;
  hasError?: boolean;
}

function getMinutesAgo(isoString: string): number {
  return Math.floor((Date.now() - new Date(isoString).getTime()) / 60000);
}

export function SyncIndicator({ lastSync, isSyncing = false, hasError = false }: SyncIndicatorProps) {
  if (hasError) {
    return (
      <div
        role="status"
        aria-label="Sync error — reconnecting"
        className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"
        />
        Reconnecting...
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div
        role="status"
        aria-label="Syncing data"
        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400"
      >
        <svg
          aria-hidden="true"
          className="w-3 h-3 animate-spin"
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
        Syncing...
      </div>
    );
  }

  if (!lastSync) {
    return (
      <div
        role="status"
        aria-label="Not synced yet"
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
      >
        <span aria-hidden="true" className="w-2 h-2 rounded-full bg-zinc-400" />
        Not synced
      </div>
    );
  }

  const minutesAgo = getMinutesAgo(lastSync);

  if (minutesAgo < 1) {
    return (
      <div
        role="status"
        aria-label="Live data — just updated"
        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"
        />
        Live
      </div>
    );
  }

  const label =
    minutesAgo === 1 ? 'Last updated: 1 minute ago' : `Last updated: ${minutesAgo} minutes ago`;

  return (
    <div
      role="status"
      aria-label={label}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
    >
      <span aria-hidden="true" className="w-2 h-2 rounded-full bg-zinc-400" />
      {label}
    </div>
  );
}

export default SyncIndicator;
