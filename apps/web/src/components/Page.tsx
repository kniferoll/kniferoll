import type { ReactNode } from "react";
import { useDarkModeContext } from "../context/DarkModeContext";
import { PageFooter } from "./PageFooter";

interface PageProps {
  header: ReactNode;
  body: ReactNode;
  footer?: boolean;
}

export function Page({ header, body, footer = true }: PageProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div
      className={`min-h-screen ${
        isDark
          ? "bg-linear-to-b from-slate-900 via-slate-800 to-slate-900"
          : "bg-linear-to-br from-amber-50 via-amber-50/80 to-orange-100"
      }`}
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Gradient overlay */}
      <div
        className={`fixed inset-0 pointer-events-none ${
          isDark
            ? "bg-linear-to-b from-slate-900 via-slate-800 to-slate-900"
            : "bg-linear-to-br from-amber-50 via-amber-50/80 to-orange-100"
        }`}
      />

      {/* Subtle texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {header}

      {body}

      {footer && <PageFooter />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
