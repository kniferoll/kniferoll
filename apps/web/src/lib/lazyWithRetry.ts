import { lazy } from "react";
import type { ComponentType } from "react";

/**
 * Wrapper around React.lazy that handles chunk load failures.
 * When a chunk fails to load (common after deploys with stale cache),
 * it reloads the page once to get fresh chunks.
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const hasRefreshed = sessionStorage.getItem("chunk-refresh");

    try {
      const module = await importFn();
      // Success - clear the refresh flag
      sessionStorage.removeItem("chunk-refresh");
      return module;
    } catch (error) {
      // If we haven't refreshed yet, try once
      if (!hasRefreshed) {
        sessionStorage.setItem("chunk-refresh", "true");
        window.location.reload();
        // Return a placeholder while reloading (won't actually render)
        return { default: (() => null) as unknown as T };
      }

      // Already refreshed once - throw to show error boundary
      throw error;
    }
  });
}
