import * as Sentry from "@sentry/react";

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENV || "production",

      // Performance monitoring
      integrations: [Sentry.browserTracingIntegration()],

      // Sample rates (adjust based on traffic)
      tracesSampleRate: 0.2, // 20% of transactions for performance
      replaysSessionSampleRate: 0, // Disable session replay (cost)
      replaysOnErrorSampleRate: 0.1, // 10% of errors get replay

      // Enable structured logging
      _experiments: {
        enableLogs: true,
      },

      // Filter out noise
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Network request failed",
        "Load failed",
      ],

      // Don't send PII
      beforeSend(event) {
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }
        return event;
      },
    });
  }
}

// Set user context after auth
export function setSentryUser(userId: string | null) {
  if (userId) {
    Sentry.setUser({ id: userId });
  } else {
    Sentry.setUser(null);
  }
}

// Manual error capture
export function captureError(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}
