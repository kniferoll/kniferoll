import type { ReactNode } from "react";
import { useDarkModeContext } from "@/context";

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 py-4 border-b backdrop-blur-md ${
          isDark
            ? "border-slate-700/50 bg-slate-900/90"
            : "border-stone-200/50 bg-amber-50/90"
        }`}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {startContent}
        {centerContent && (
          <div className="flex-1 flex justify-center">{centerContent}</div>
        )}
        {endContent}
      </header>
      {/* Spacer to push content below fixed header */}
      <div
        className="w-full"
        style={{
          height: "calc(72px + env(safe-area-inset-top, 0px))",
          minHeight: "72px"
        }}
      />
    </>
  );
}
