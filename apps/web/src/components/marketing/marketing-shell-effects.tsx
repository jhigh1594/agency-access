'use client';

import { useEffect } from 'react';
import {
  ANIMATIONS_READY_CLASS,
  ANIMATIONS_READY_EVENT,
  HYDRATED_CLASS,
  HYDRATED_EVENT,
} from '@/lib/animation-lifecycle';

export function MarketingShellEffects() {
  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      document.documentElement.classList.add(HYDRATED_CLASS);
      window.dispatchEvent(new Event(HYDRATED_EVENT));
    });

    const timeoutId = window.setTimeout(() => {
      document.documentElement.classList.add(ANIMATIONS_READY_CLASS);
      window.dispatchEvent(new Event(ANIMATIONS_READY_EVENT));
    }, 100);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
