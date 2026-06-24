interface StaleBalanceBannerProps {
  isStale: boolean;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function StaleBalanceBanner({ isStale, onRefresh, isRefreshing = false }: StaleBalanceBannerProps) {
  if (!isStale) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <span className="text-sm">Your leave balances may have changed.</span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-sm font-medium underline underline-offset-2 hover:no-underline flex-shrink-0 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isRefreshing && (
          <svg aria-hidden="true" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {isRefreshing ? "Refreshing..." : "Refresh now"}
      </button>
    </div>
  );
}

export default StaleBalanceBanner;
