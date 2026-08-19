'use client';

/**
 * Shared copy-to-clipboard hook.
 *
 * Wraps the repeated pattern: write text, flag copied, reset after a delay.
 * The returned `copy` resolves to false and logs when the clipboard API fails.
 */
import { useCallback, useState } from 'react';

export function useCopyToClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string, onCopy?: () => void) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), resetMs);
        onCopy?.();
        return true;
      } catch (err) {
        console.error('Failed to copy:', err);
        return false;
      }
    },
    [resetMs]
  );

  return { copied, copy };
}
