'use client';

import { useEffect } from 'react';
import {
  ANIMATIONS_READY_CLASS,
  ANIMATIONS_READY_EVENT,
  HYDRATED_CLASS,
  HYDRATED_EVENT,
} from '@/lib/animation-lifecycle';

/**
 * AnimationGate — app-wide animation lifecycle (v2.0).
 *
 * Adds `hydrated` on the first frame and `animations-ready` after the
 * 100ms paint window. Mounted by the ROOT layout so every route group
 * (not just marketing) can animate skeleton loaders (`animate-pulse`)
 * and gate `reveal-element` transitions. See globals.css gates and
 * DESIGN_SYSTEM.md animation rules.
 */
export function AnimationGate() {
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
