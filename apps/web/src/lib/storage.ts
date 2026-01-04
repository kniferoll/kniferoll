/**
 * Safe localStorage utilities
 *
 * Wraps localStorage access with try-catch to handle:
 * - Private/incognito browsing mode
 * - Storage quota exceeded
 * - Enterprise browsers with strict policies
 */

import * as Sentry from "@sentry/react";

/**
 * Safely get an item from localStorage
 * Returns fallback value if storage access fails
 */
export function safeGetItem(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    Sentry.captureException(error, {
      tags: { storage_operation: "getItem", storage_key: key },
    });
    return fallback;
  }
}

/**
 * Safely set an item in localStorage
 * Returns true on success, false on failure
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { storage_operation: "setItem", storage_key: key },
    });
    return false;
  }
}

/**
 * Safely remove an item from localStorage
 * Returns true on success, false on failure
 */
export function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { storage_operation: "removeItem", storage_key: key },
    });
    return false;
  }
}
