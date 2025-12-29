import type { ReactNode } from "react";
import { useDarkModeContext } from "@/context/DarkModeContext";

interface PageHeaderProps {
  startContent: ReactNode;
  endContent: ReactNode;
  centerContent?: ReactNode;
}

export function PageHeader({
  startContent,
  endContent,
  centerContent,
}: PageHeaderProps) {
  const { isDark } = useDarkModeContext();

  return (
    <header
      className={`relative z-10 flex justify-between items-center px-8 py-6 border-b ${
        isDark ? "border-slate-700/50" : "border-stone-200/50"
      }`}
    >
      {startContent}
      {centerContent && (
        <div className="flex-1 flex justify-center">{centerContent}</div>
      )}
      {endContent}
    </header>
  );
}
