import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { XIcon } from "@/components/icons";

interface DismissibleAlertProps {
  variant?: "error" | "success" | "warning" | "info";
  children: ReactNode;
  onDismiss: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * DismissibleAlert - Alert with close button and optional action.
 *
 * Variants:
 * - error: Red, for errors and failures
 * - success: Green, for confirmations
 * - warning: Amber, for cautions
 * - info: Blue, for informational messages
 */
export function DismissibleAlert({
  variant = "info",
  children,
  onDismiss,
  action,
  className = "",
}: DismissibleAlertProps) {
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

  const actionStyles = {
    error: isDark
      ? "text-red-300 hover:text-red-200 hover:bg-red-900/30"
      : "text-red-700 hover:text-red-800 hover:bg-red-100",
    success: isDark
      ? "text-green-300 hover:text-green-200 hover:bg-green-900/30"
      : "text-green-700 hover:text-green-800 hover:bg-green-100",
    warning: isDark
      ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30"
      : "text-amber-700 hover:text-amber-800 hover:bg-amber-100",
    info: isDark
      ? "text-blue-300 hover:text-blue-200 hover:bg-blue-900/30"
      : "text-blue-700 hover:text-blue-800 hover:bg-blue-100",
  };

  const dismissStyles = isDark
    ? "text-current opacity-60 hover:opacity-100 hover:bg-white/10"
    : "text-current opacity-60 hover:opacity-100 hover:bg-black/5";

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg text-sm ${variantStyles[variant]} ${className}`}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {action && (
        <button
          onClick={action.onClick}
          className={`shrink-0 px-3 py-1 rounded-md text-sm font-medium transition-colors ${actionStyles[variant]}`}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors ${dismissStyles}`}
        aria-label="Dismiss"
      >
        <XIcon size={16} />
      </button>
    </div>
  );
}
