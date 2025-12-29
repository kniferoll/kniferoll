import type { ReactNode } from "react";
import { useDarkModeContext } from "../context/DarkModeContext";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

interface PageProps {
  children: ReactNode;
  showLogoClickable?: boolean;
  showFooter?: boolean;
}

export function Page({
  children,
  showLogoClickable = false,
  showFooter = true,
}: PageProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDark ? "bg-slate-900 text-white" : "bg-stone-50 text-gray-900"
      }`}
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Gradient overlay */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          isDark
            ? "bg-linear-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-linear-to-br from-amber-50/80 via-orange-50/40 to-stone-100/80"
        }`}
      />

      <PageHeader showLogoClickable={showLogoClickable} />

      {children}

      {showFooter && <PageFooter />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
