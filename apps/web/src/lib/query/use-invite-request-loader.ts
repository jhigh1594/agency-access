'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import posthog from 'posthog-js';

export type InviteLoadPhase = 'loading' | 'delayed' | 'timeout' | 'ready' | 'error';

interface UseInviteRequestLoaderOptions<TData> {
  endpoint: string;
  source: 'invite-core' | 'manual-beehiiv' | 'manual-kit' | 'manual-pinterest';
  delayedMs?: number;
  timeoutMs?: number;
  parseData?: (payload: any) => TData;
}

interface UseInviteRequestLoaderResult<TData> {
  data: TData | null;
  error: string | null;
  phase: InviteLoadPhase;
  retry: () => void;
}

export function useInviteRequestLoader<TData>({
  endpoint,
  source,
  delayedMs = 8000,
  timeoutMs = 20000,
  parseData,
}: UseInviteRequestLoaderOptions<TData>): UseInviteRequestLoaderResult<TData> {
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<InviteLoadPhase>('loading');

  const requestIdRef = useRef(0);

  const retry = useCallback(() => {
    posthog.capture('client_invite_load_retry', { source, attempt: attempt + 1 });
    setAttempt((prev) => prev + 1);
  }, [attempt, source]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const abortController = new AbortController();

    setPhase('loading');
    setError(null);
    setData(null);

    const delayedTimer = window.setTimeout(() => {
      if (requestIdRef.current !== requestId) return;
      setPhase((currentPhase) => {
        if (currentPhase !== 'loading') return currentPhase;
        posthog.capture('client_invite_load_delayed', { source, attempt: attempt + 1 });
        return 'delayed';
      });
    }, delayedMs);

    const timeoutTimer = window.setTimeout(() => {
      if (requestIdRef.current !== requestId) return;
      posthog.capture('client_invite_load_timed_out', { source, attempt: attempt + 1 });
      setPhase('timeout');
      setError('This is taking longer than expected.');
      abortController.abort();
    }, timeoutMs);

    const executeFetch = async () => {
      try {
        const response = await fetch(endpoint, { signal: abortController.signal });
        const payload = await response.json();

        if (requestIdRef.current !== requestId) return;

        if (!response.ok || payload.error || !payload.data) {
          throw new Error(payload.error?.message || 'Failed to load authorization request.');
        }

        const parsed = parseData ? parseData(payload.data) : payload.data;
        setData(parsed as TData);
        setPhase('ready');
      } catch (err) {
        if (requestIdRef.current !== requestId) return;

        if (abortController.signal.aborted) {
          return;
        }

        setPhase('error');
        setError(err instanceof Error ? err.message : 'Failed to load authorization request.');
      } finally {
        window.clearTimeout(delayedTimer);
        window.clearTimeout(timeoutTimer);
      }
    };

    executeFetch();

    return () => {
      abortController.abort();
      window.clearTimeout(delayedTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [attempt, delayedMs, endpoint, parseData, source, timeoutMs]);

  return {
    data,
    error,
    phase,
    retry,
  };
}
