'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useTransientMessage<T>(durationMs = 5000) {
  const [message, setMessage] = useState<T | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearMessage = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessage(null);
  }, []);

  const showMessage = useCallback((nextMessage: T | null) => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setMessage(nextMessage);
    if (nextMessage !== null) {
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setMessage(null);
      }, durationMs);
    }
  }, [durationMs]);

  useEffect(() => clearMessage, [clearMessage]);

  return [message, showMessage, clearMessage] as const;
}
