import posthog from 'posthog-js';

type OnboardingEventProperties = Record<string, unknown>;

export function trackOnboardingEvent(
  eventName: string,
  properties: OnboardingEventProperties
) {
  try {
    posthog.capture(eventName, properties);
  } catch {
    // Non-blocking analytics path.
  }

  if (typeof window === 'undefined') {
    return;
  }

  const legacyAnalytics = (window as any).analytics;
  if (typeof legacyAnalytics?.track !== 'function') {
    return;
  }

  try {
    legacyAnalytics.track(eventName, properties);
  } catch {
    // Non-blocking analytics path.
  }
}
