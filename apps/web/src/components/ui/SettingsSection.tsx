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
    <div className={`py-8 ${className}`}>
      <h3
        className={`text-base font-semibold mb-1 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </h3>
      {description && (
        <p
          className={`text-sm mb-6 ${
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
