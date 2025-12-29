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
    setConfig((prev) => ({ ...prev, ...newConfig }));
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
