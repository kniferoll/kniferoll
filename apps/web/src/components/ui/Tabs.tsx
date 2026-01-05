import { createContext, useContext, type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

interface TabsProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function Tabs({ value, onChange, children }: TabsProps) {
  return (
    <TabsContext.Provider value={{ activeTab: value, setActiveTab: onChange }}>
      {children}
    </TabsContext.Provider>
  );
}

interface TabListProps {
  children: ReactNode;
}

export function TabList({ children }: TabListProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div
      className={`border-b flex overflow-x-auto scrollbar-hide -mx-px ${
        isDark ? "border-slate-700/50" : "border-stone-200"
      }`}
    >
      {children}
    </div>
  );
}

interface TabProps {
  value: string;
  children: ReactNode;
}

export function Tab({ value, children }: TabProps) {
  const { activeTab, setActiveTab } = useTabs();
  const { isDark } = useDarkModeContext();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-3 sm:px-5 py-3 sm:py-3.5 text-sm sm:text-base font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
        isActive
          ? `border-orange-500 ${isDark ? "text-orange-400" : "text-orange-600"}`
          : `border-transparent ${
              isDark
                ? "text-slate-400 hover:text-slate-200"
                : "text-gray-500 hover:text-gray-800"
            }`
      }`}
    >
      {children}
    </button>
  );
}

interface TabPanelProps {
  value: string;
  children: ReactNode;
}

export function TabPanel({ value, children }: TabPanelProps) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return <div className="px-4 py-5 sm:p-6">{children}</div>;
}
