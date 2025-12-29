import { type ReactNode } from "react";
import { useDarkModeContext } from "../context/DarkModeContext";

interface IconBoxProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "accent" | "muted";
  children: ReactNode;
  className?: string;
}

/**
 * IconBox - consistent icon container styling.
 *
 * Sizes:
 * - sm: w-7 h-7 (footer logo)
 * - md: w-10 h-10 (feature icons)
 * - lg: w-14 h-14 (card icons)
 * - xl: w-16 h-16 (empty state icons)
 *
 * Variants:
 * - default: Subtle background
 * - accent: Orange/brand colored
 * - muted: Very subtle, for disabled states
 */
export function IconBox({
  size = "md",
  variant = "default",
  children,
  className = "",
}: IconBoxProps) {
  const { isDark } = useDarkModeContext();

  const sizeStyles = {
    sm: "w-7 h-7 rounded-md",
    md: "w-10 h-10 rounded-xl",
    lg: "w-14 h-14 rounded-xl",
    xl: "w-16 h-16 rounded-xl",
  };

  const variantStyles = {
    default: isDark
      ? "bg-slate-700 border border-slate-600 text-gray-400"
      : "bg-stone-100 border border-stone-200 text-gray-600",
    accent: isDark
      ? "bg-slate-800 border border-slate-700 text-orange-400"
      : "bg-orange-50 border border-orange-100 text-orange-500",
    muted: isDark
      ? "bg-slate-800 border border-slate-700 text-gray-600"
      : "bg-stone-300 border border-stone-400 text-gray-500",
  };

  return (
    <div
      className={`
        flex items-center justify-center 
        ${sizeStyles[size]} 
        ${variantStyles[variant]} 
        ${className}
      `}
    >
      {children}
    </div>
  );
}
