import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface SettingsLayoutProps {
  children: ReactNode;
  secondaryNav?: {
    name: string;
    value: string;
    current: boolean;
  }[];
  onSecondaryNavClick?: (value: string) => void;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Main layout for settings pages - handles the content area
 * to the right of the sidebar
 */
export function SettingsLayout({
  children,
  secondaryNav,
  onSecondaryNavClick,
}: SettingsLayoutProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="xl:pl-72">
      {/* Secondary navigation header */}
      {secondaryNav && secondaryNav.length > 0 && (
        <header
          className={classNames(
            "sticky top-0 z-30 border-b backdrop-blur-sm",
            isDark
              ? "bg-slate-900/95 border-slate-800"
              : "bg-white/95 border-gray-200"
          )}
        >
          <nav className="flex h-14 items-center overflow-x-auto px-6 gap-x-1">
            {secondaryNav.map((item) => (
              <button
                key={item.name}
                onClick={() => onSecondaryNavClick?.(item.value)}
                className={classNames(
                  item.current
                    ? isDark
                      ? "bg-slate-800 text-white"
                      : "bg-gray-100 text-gray-900"
                    : isDark
                    ? "text-slate-400 hover:text-white hover:bg-slate-800/50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  "cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                )}
              >
                {item.name}
              </button>
            ))}
          </nav>
        </header>
      )}

      {/* Main content */}
      <main
        className={classNames(
          "min-h-[calc(100vh-73px)] px-4 sm:px-6 lg:px-8",
          isDark ? "bg-transparent" : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-2xl">{children}</div>
      </main>
    </div>
  );
}
