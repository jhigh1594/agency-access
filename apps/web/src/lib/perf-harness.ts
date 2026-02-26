export interface PerfHarnessContext {
  token: string;
  principalId: string | null;
}

let perfTimerCounter = 0;

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
