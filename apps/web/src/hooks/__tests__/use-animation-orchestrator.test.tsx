import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAnimationOrchestrator } from '../use-animation-orchestrator';

function TestComponent() {
  const { isHydrated, isMounted, animationsReady, shouldAnimate } = useAnimationOrchestrator();

  return (
    <div>
      <div data-testid="is-hydrated">{String(isHydrated)}</div>
      <div data-testid="is-mounted">{String(isMounted)}</div>
      <div data-testid="animations-ready">{String(animationsReady)}</div>
      <div data-testid="should-animate">{String(shouldAnimate)}</div>
    </div>
  );
}

describe('useAnimationOrchestrator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.classList.remove('hydrated', 'animations-ready');

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-reduced-motion: reduce)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    Object.defineProperty(window, 'requestAnimationFrame', {
      writable: true,
      value: (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove('hydrated', 'animations-ready');
  });

  it('does not mutate html animation classes on its own', () => {
    render(<TestComponent />);

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(document.documentElement.classList.contains('hydrated')).toBe(false);
    expect(document.documentElement.classList.contains('animations-ready')).toBe(false);
  });

  it('tracks shared animation readiness when the marketing shell dispatches lifecycle events', () => {
    render(<TestComponent />);

    act(() => {
      document.documentElement.classList.add('hydrated');
      window.dispatchEvent(new Event('authhub:hydrated'));
    });

    expect(screen.getByTestId('is-hydrated')).toHaveTextContent('true');
    expect(screen.getByTestId('is-mounted')).toHaveTextContent('true');

    act(() => {
      document.documentElement.classList.add('animations-ready');
      window.dispatchEvent(new Event('authhub:animations-ready'));
    });

    expect(screen.getByTestId('animations-ready')).toHaveTextContent('true');
    expect(screen.getByTestId('should-animate')).toHaveTextContent('true');
  });
});
