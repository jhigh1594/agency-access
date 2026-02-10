/**
 * TypeScript declaration for window.posthog (PostHog JS library).
 * See: https://posthog.com/docs/libraries/js#using-typescript-with-the-script-tag
 */
import type posthog from 'posthog-js';

declare global {
  interface Window {
    posthog?: typeof posthog;
  }
}

export {};
