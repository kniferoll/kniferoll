import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface AlertProps {
  variant?: "error" | "success" | "warning" | "info";
  children: ReactNode;
  className?: string;
}

/**
 * Alert - consistent alert/notification styling.
 *
 * Variants:
 * - error: Red, for errors and failures
 * - success: Green, for confirmations
 * - warning: Amber, for cautions
 * - info: Blue, for informational messages
 */
export function Alert({
  variant = "info",
  children,
  className = "",
}: AlertProps) {
  const { isDark } = useDarkModeContext();

  const variantStyles = {
    error: isDark
      ? "bg-red-950/50 text-red-400 border border-red-900/50"
      : "bg-red-50 text-red-600 border border-red-100",
    success: isDark
      ? "bg-green-950/50 text-green-400 border border-green-900/50"
      : "bg-green-50 text-green-600 border border-green-100",
    warning: isDark
      ? "bg-amber-950/50 text-amber-400 border border-amber-900/50"
      : "bg-amber-50 text-amber-600 border border-amber-100",
    info: isDark
      ? "bg-blue-950/50 text-blue-400 border border-blue-900/50"
      : "bg-blue-50 text-blue-600 border border-blue-100",
  };

  return (
    <div
      className={`p-3 rounded-lg text-sm ${variantStyles[variant]} ${className}`}
    >
      {children}
    </div>
  );
}
