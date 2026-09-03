import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn:
    process.env.NEXT_PUBLIC_SENTRY_DSN ||
    "https://336d2646d3970e13ba997b0f41a0c8dd@o4511018218946560.ingest.us.sentry.io/4511018267574272",

  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],

  enableLogs: true,

  beforeSend(event) {
    if (
      process.env.NODE_ENV === "development" &&
      process.env.SENTRY_SEND_IN_DEV !== "true"
    ) {
      return null;
    }
    return event;
  },

  environment: process.env.NODE_ENV || "development",
  release: process.env.NEXT_PUBLIC_APP_VERSION || undefined,
});
