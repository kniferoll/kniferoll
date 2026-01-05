import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "selected" | "suggestion" | "muted";
  size?: "sm" | "md";
  children: ReactNode;
  /** Optional dismiss handler - shows X button when provided */
  onDismiss?: () => void;
}

/**
 * Pill - rounded pill/chip component for selections, tags, and quick actions.
 *
 * Variants:
 * - default: Stone/slate background, neutral text
 * - selected: Dark/light inverted, for active selection
 * - suggestion: Neutral background, for suggested items (with dismiss)
 * - muted: Lighter appearance for less emphasis
 *
 * Sizes:
 * - sm: Compact (px-2.5 py-1 text-xs)
 * - md: Default (px-3.5 py-1.5 text-sm)
 */
export function Pill({
  variant = "default",
  size = "md",
  children,
  onDismiss,
  className = "",
  disabled,
  ...props
}: PillProps) {
  const baseStyles =
    "rounded-full font-medium shrink-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs max-w-[100px]",
    md: "px-3.5 py-1.5 text-sm max-w-[140px]",
  };

  const variantStyles = {
    default:
      "bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-600",
    selected: "bg-stone-800 dark:bg-slate-200 text-white dark:text-slate-900",
    suggestion:
      "bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-600 active:scale-[0.97]",
    muted:
      "bg-stone-50 dark:bg-slate-800 text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-700",
  };

  return (
    <button
      type="button"
      className={`
        ${baseStyles}
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${onDismiss ? "flex items-center gap-1" : "truncate"}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <span className={onDismiss ? "truncate" : ""}>{children}</span>
      {onDismiss && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex items-center justify-center w-4 h-4 -mr-1 rounded-full text-xs text-current opacity-50 hover:opacity-100"
        >
          ×
        </span>
      )}
    </button>
  );
}
