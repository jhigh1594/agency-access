/**
 * Characterization tests for the shared formatters (U11).
 * Each assertion compares the shared helper against the exact inline
 * expression it replaced, computed in the same process (locale-stable).
 */
import { describe, it, expect } from 'vitest';
import { formatShortDate, formatMediumDate, formatUsdFromCents } from '../format';

describe('formatShortDate', () => {
  const iso = '2026-08-18T12:34:56.000Z';
  const earlier = '2024-01-02T00:00:00.000Z';

  it('matches the replaced inline formatter for representative inputs', () => {
    // Original: new Date(value).toLocaleDateString()
    expect(formatShortDate(iso)).toBe(new Date(iso).toLocaleDateString());
    expect(formatShortDate(earlier)).toBe(new Date(earlier).toLocaleDateString());
    expect(formatShortDate(new Date(iso))).toBe(new Date(iso).toLocaleDateString());
  });

  it('returns the fallback for nullish input', () => {
    expect(formatShortDate(null)).toBe('n/a');
    expect(formatShortDate(undefined)).toBe('n/a');
    expect(formatShortDate(null, '—')).toBe('—');
  });
});

describe('formatMediumDate', () => {
  it('matches the replaced en-US inline formatter', () => {
    const iso = '2026-08-18T12:34:56.000Z';
    // Original: new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    expect(formatMediumDate(iso)).toBe(
      new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    );
    expect(formatMediumDate(new Date(iso))).toBe(formatMediumDate(iso));
  });
});

describe('formatUsdFromCents', () => {
  it('matches the replaced inline currency formatter', () => {
    const inline = (cents: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(cents / 100);

    expect(formatUsdFromCents(0)).toBe(inline(0));
    expect(formatUsdFromCents(123456)).toBe(inline(123456));
    expect(formatUsdFromCents(99)).toBe(inline(99));
    expect(formatUsdFromCents(-2500)).toBe(inline(-2500));
  });
});
