import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AnimationGate } from '../animation-gate';
import {
  HYDRATED_CLASS,
  ANIMATIONS_READY_CLASS,
  HYDRATED_EVENT,
  ANIMATIONS_READY_EVENT,
} from '@/lib/animation-lifecycle';

/**
 * The animations-ready gate must be reachable from EVERY route group.
 * It previously lived only in the marketing shell, so `animate-pulse`
 * skeleton loaders on authenticated pages never animated and
 * `reveal-element` gating was dead outside marketing.
 */
describe('AnimationGate', () => {
  beforeEach(() => {
    document.documentElement.className = '';
  });

  afterEach(() => {
    document.documentElement.className = '';
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('adds the hydrated class and event within the first animation frame', () => {
    const hydratedSpy = vi.fn();
    window.addEventListener(HYDRATED_EVENT, hydratedSpy);
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 0;
      });

    render(<AnimationGate />);

    expect(rafSpy).toHaveBeenCalled();
    expect(document.documentElement.classList.contains(HYDRATED_CLASS)).toBe(true);
    expect(hydratedSpy).toHaveBeenCalled();
    window.removeEventListener(HYDRATED_EVENT, hydratedSpy);
  });

  it('adds the animations-ready class and event after the 100ms paint window', () => {
    const readySpy = vi.fn();
    window.addEventListener(ANIMATIONS_READY_EVENT, readySpy);
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    render(<AnimationGate />);
    expect(document.documentElement.classList.contains(ANIMATIONS_READY_CLASS)).toBe(false);

    vi.advanceTimersByTime(101);

    expect(document.documentElement.classList.contains(ANIMATIONS_READY_CLASS)).toBe(true);
    expect(readySpy).toHaveBeenCalled();
    window.removeEventListener(ANIMATIONS_READY_EVENT, readySpy);
  });

  it('is mounted by the ROOT layout from the shared module — gate reachable on all route groups', () => {
    const rootLayout = readFileSync(join(__dirname, '../../app/layout.tsx'), 'utf-8');
    expect(rootLayout).toMatch(/import\s*\{\s*AnimationGate\s*\}\s*from\s*["']@\/components\/animation-gate["']/);
    expect(rootLayout).toMatch(/<AnimationGate\s*\/?>/);
  });
});
