import { type HTMLAttributes, type ReactNode } from "react";
import { useDarkModeContext } from "../context/DarkModeContext";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dashed" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
}

/**
 * Card component with consistent styling across the app.
 *
 * Variants:
 * - default: Solid border, standard card
 * - dashed: Dashed border, empty states / add actions
 * - interactive: Hover effects, clickable cards
 *
 * Padding:
 * - none: No padding (for custom layouts)
 * - sm: p-4
 * - md: p-6
 * - lg: p-8
 */
export function Card({
  variant = "default",
  padding = "md",
  children,
  className = "",
  ...props
}: CardProps) {
  const { isDark } = useDarkModeContext();

  const baseStyles = "rounded-2xl transition-all";

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const variantStyles = {
    default: isDark
      ? "bg-slate-800/50 border border-slate-700"
      : "bg-white border border-stone-200",
    dashed: isDark
      ? "border-2 border-dashed border-slate-700 bg-slate-800/30"
      : "border-2 border-dashed border-stone-300 bg-stone-100/30",
    interactive: isDark
      ? `
        bg-gradient-to-br from-slate-800 to-slate-900 
        border border-slate-700 
        hover:border-slate-600 
        hover:shadow-xl hover:shadow-slate-900/50 
        cursor-pointer
      `
      : `
        bg-white 
        border border-stone-200 
        hover:border-stone-300 
        hover:shadow-xl hover:shadow-stone-900/10 
        cursor-pointer
      `,
  };

  return (
    <div
      className={`
        ${baseStyles} 
        ${paddingStyles[padding]} 
        ${variantStyles[variant]} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
