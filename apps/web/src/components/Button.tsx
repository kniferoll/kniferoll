import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useDarkModeContext } from "../context/DarkModeContext";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

/**
 * Button component with consistent styling across the app.
 *
 * Variants:
 * - primary: Orange gradient, main CTA
 * - secondary: Bordered, secondary actions
 * - ghost: No border, subtle actions
 *
 * Sizes:
 * - sm: Compact (py-2 px-4)
 * - md: Default (py-2.5 px-5)
 * - lg: Large CTA (py-3.5 px-8)
 */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const { isDark } = useDarkModeContext();

  const baseStyles =
    "font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles = {
    sm: "py-2 px-4 text-sm",
    md: "py-2.5 px-5 text-sm",
    lg: "py-3.5 px-8 text-base",
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-orange-500 to-orange-600 
      text-white 
      shadow-lg shadow-orange-500/30 
      hover:shadow-xl hover:shadow-orange-500/40 
      hover:-translate-y-0.5 
      disabled:hover:translate-y-0 
      disabled:hover:shadow-lg
    `,
    secondary: isDark
      ? `
        border-2 border-slate-600 
        text-white 
        hover:bg-slate-800 hover:border-slate-500
      `
      : `
        border-2 border-stone-300 
        text-gray-900 
        hover:bg-white hover:border-stone-400
      `,
    ghost: isDark
      ? `
        text-gray-300 
        hover:text-white hover:bg-slate-700
      `
      : `
        text-gray-600 
        hover:text-gray-900 hover:bg-stone-200/50
      `,
  };

  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <button
      className={`
        ${baseStyles} 
        ${sizeStyles[size]} 
        ${variantStyles[variant]} 
        ${widthStyles} 
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
