import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function SettingsSection({
  title,
  description,
  children,
  className = "",
  headerAction,
}: SettingsSectionProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className={`py-4 sm:py-5 first:pt-0 ${className}`}>
      <div
        className={`flex items-center justify-between gap-3 ${
          description ? "mb-0.5" : "mb-3"
        }`}
      >
        <h3
          className={`text-sm sm:text-base font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        {headerAction}
      </div>
      {description && (
        <p
          className={`text-xs sm:text-sm mb-3 ${
            isDark ? "text-slate-400" : "text-gray-500"
          }`}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
