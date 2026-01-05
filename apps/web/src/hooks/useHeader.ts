import { useContext, useLayoutEffect, useRef } from "react";
import { HeaderContext, type HeaderConfig } from "@/context";

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
}

/**
 * Set the header configuration for a page.
 * Uses useLayoutEffect to set before paint.
 * Updates when any dependency changes.
 */
export function useHeaderConfig(config: HeaderConfig, deps: React.DependencyList = []) {
  const { setHeader } = useHeader();
  const configRef = useRef(config);
  configRef.current = config;

  useLayoutEffect(() => {
    setHeader(configRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Set the default header configuration for the layout.
 * Only runs once on mount - pages override via useHeaderConfig.
 */
export function useDefaultHeaderConfig(config: HeaderConfig) {
  const { setHeader } = useHeader();
  const configRef = useRef(config);

  // Only set once on mount
  useLayoutEffect(() => {
    setHeader(configRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
