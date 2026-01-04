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
    <div className={`py-5 sm:py-6 ${className}`}>
      <div
        className={`flex items-center justify-between gap-4 ${
          description ? "mb-0.5" : "mb-4"
        }`}
      >
        <h3
          className={`text-base font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        {headerAction}
      </div>
      {description && (
        <p
          className={`text-xs sm:text-sm mb-4 ${
            isDark ? "text-slate-400" : "text-gray-600"
          }`}
        >
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
