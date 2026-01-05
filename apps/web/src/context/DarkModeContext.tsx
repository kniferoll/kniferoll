/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";
import { useDarkMode } from "@/hooks";

interface DarkModeContextType {
  isDark: boolean | null;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, toggle } = useDarkMode();

  return <DarkModeContext.Provider value={{ isDark, toggle }}>{children}</DarkModeContext.Provider>;
}

export function useDarkModeContext() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkModeContext must be used within DarkModeProvider");
  }
  return context;
}
