import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  fullWidth = false,
}: ButtonProps) {
  const baseStyles = "py-2 px-4 rounded-lg font-semibold transition-colors";
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
    secondary:
      "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50",
  };
  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthStyle} ${className}`}
    >
      {children}
    </button>
  );
}
