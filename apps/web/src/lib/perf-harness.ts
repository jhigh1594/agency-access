export interface PerfHarnessContext {
  token: string;
  principalId: string | null;
}

let perfTimerCounter = 0;
const PERF_HARNESS_DASHBOARD_REDIRECT_MARK = 'perf-harness:dashboard-redirect-start';

/**
 * Development-only helper for perf harness scripts.
 * Reads synthetic auth context from localStorage.
 */
export function readPerfHarnessContext(): PerfHarnessContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const token = window.localStorage.getItem('__perf_auth_token');
  if (!token) {
    return null;
  }

  return {
    token,
    principalId: window.localStorage.getItem('__perf_principal_id'),
  };
}

/**
 * Starts a development-only console timer with a unique label.
 * Returns an end function to close the timer safely.
 */
export function startPerfTimer(baseLabel: string): (() => void) | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const label = `${baseLabel}#${perfTimerCounter++}`;
  console.time(label);

  return () => {
    console.timeEnd(label);
  };
}

export function markPerfHarnessDashboardRedirectStart(): void {
  if (typeof performance === 'undefined' || process.env.NODE_ENV === 'production') {
    return;
  }

  performance.clearMarks(PERF_HARNESS_DASHBOARD_REDIRECT_MARK);
  performance.mark(PERF_HARNESS_DASHBOARD_REDIRECT_MARK);
}

export function readPerfHarnessDashboardRedirectStart(): number | null {
  if (typeof performance === 'undefined' || process.env.NODE_ENV === 'production') {
    return null;
  }

  const [mark] = performance.getEntriesByName(PERF_HARNESS_DASHBOARD_REDIRECT_MARK);
  return mark ? mark.startTime : null;
}
