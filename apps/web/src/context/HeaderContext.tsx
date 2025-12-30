import { createContext, useState, useCallback, type ReactNode } from "react";

export interface HeaderConfig {
  startContent?: ReactNode;
  centerContent?: ReactNode;
  endContent?: ReactNode;
  visible?: boolean;
  variant?: "default" | "transparent" | "minimal";
}

export interface HeaderContextValue {
  config: HeaderConfig;
  setHeader: (config: HeaderConfig) => void;
  resetHeader: () => void;
}

const defaultConfig: HeaderConfig = {
  startContent: null,
  centerContent: null,
  endContent: null,
  visible: true,
  variant: "default",
};

export const HeaderContext = createContext<HeaderContextValue | null>(null);

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<HeaderConfig>(defaultConfig);

  const setHeader = useCallback((newConfig: HeaderConfig) => {
    setConfig((prev) => {
      // Compare relevant keys to avoid unnecessary updates
      const merged = { ...prev, ...newConfig };
      // Only update if something actually changed
      if (
        prev.startContent === merged.startContent &&
        prev.centerContent === merged.centerContent &&
        prev.endContent === merged.endContent &&
        prev.visible === merged.visible &&
        prev.variant === merged.variant
      ) {
        return prev;
      }
      return merged;
    });
  }, []);

  const resetHeader = useCallback(() => {
    setConfig(defaultConfig);
  }, []);

  return (
    <HeaderContext.Provider value={{ config, setHeader, resetHeader }}>
      {children}
    </HeaderContext.Provider>
  );
}
