import type { ReactNode } from "react";
import { useDarkModeContext } from "@/context/DarkModeContext";
import { useHeader } from "@/hooks/useHeader";
import { PageHeader } from "@/components";

interface LayoutShellProps {
  children: ReactNode;
}

/**
 * LayoutShell provides the shared visual foundation for all layouts:
 * - Background gradients and textures
 * - Font loading
 * - Header rendering (reads from HeaderContext)
 *
 * The header content is controlled via HeaderContext, allowing pages
 * to customize it without the header component unmounting.
 */
export function LayoutShell({ children }: LayoutShellProps) {
  const { isDark } = useDarkModeContext();
  const { config } = useHeader();

  return (
    <div
      className={`min-h-screen flex flex-col ${
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

      {/* Header - renders content from HeaderContext */}
      {config.visible !== false && (
        <PageHeader
          startContent={config.startContent}
          centerContent={config.centerContent}
          endContent={config.endContent}
        />
      )}

      {/* Main content */}
      <main className="relative z-1 flex-1 flex flex-col">{children}</main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
