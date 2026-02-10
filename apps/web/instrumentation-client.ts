import posthog from 'posthog-js';

/**
 * Deferred PostHog Initialization
 *
 * PostHog is initialized using requestIdleCallback to defer loading until
 * after the page has finished its critical rendering path. This significantly
 * improves First Contentful Paint (FCP) by preventing analytics scripts
 * from blocking the initial render.
 *
 * Falls back to setTimeout if requestIdleCallback is not available.
 */
function initPosthog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || key === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[PostHog] NEXT_PUBLIC_POSTHOG_KEY is missing. Add it to .env.local and restart the dev server. Events will not be sent.'
      );
    }
    return;
  }
  try {
    posthog.init(key, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      // Include the defaults option as required by PostHog
      defaults: '2025-11-30',
      // Enables capturing unhandled exceptions via Error Tracking
      capture_exceptions: true,
      // Turn on debug in development mode
      debug: process.env.NODE_ENV === 'development',
      // Reduce batch size to send events sooner
      batch_size: 10,
      // Flush after 5 seconds instead of 30 to not lose events on short sessions
      flush_interval: 5000,
    });
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[PostHog] Initialization failed:', e);
    }
  }
}

// Use requestIdleCallback if available, otherwise use setTimeout
if (typeof requestIdleCallback !== 'undefined') {
  requestIdleCallback(() => initPosthog(), { timeout: 3000 });
} else {
  // Fallback for browsers that don't support requestIdleCallback
  setTimeout(() => initPosthog(), 100);
}

// IMPORTANT: Never combine this approach with other client-side PostHog initialization approaches,
// especially components like a PostHogProvider. instrumentation-client.ts is the correct solution
// for initializing client-side PostHog in Next.js 15.3+ apps.
