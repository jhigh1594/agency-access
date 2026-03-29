/**
 * Lazy-loads posthog-js so analytics does not compete with interaction (INP) on the main thread.
 */
export async function capturePosthogEvent(
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  try {
    const { default: posthog } = await import('posthog-js');
    posthog.capture(event, properties);
  } catch {
    // Ignore analytics failures.
  }
}
