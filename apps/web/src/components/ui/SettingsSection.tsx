import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className = "",
}: SettingsSectionProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className={`py-5 sm:py-6 ${className}`}>
      <h3
        className={`text-sm font-semibold mb-0.5 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </h3>
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
