import { useId } from "react";
import { useDarkModeContext } from "@/context";

interface FormInputProps {
  id?: string;
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  helperText?: string;
  autoFocus?: boolean;
  error?: string;
}

export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
  required = true,
  minLength,
  helperText,
  autoFocus,
  error,
}: FormInputProps) {
  const { isDark } = useDarkModeContext();
  const generatedId = useId();
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={`block text-sm font-medium mb-2 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        autoFocus={autoFocus}
        className={`w-full px-4 py-3 rounded-xl border transition-all ${
          error
            ? isDark
              ? "bg-slate-700/50 border-red-500 text-white placeholder-gray-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "bg-white border-red-500 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            : isDark
              ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              : "bg-white border-stone-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {error && (
        <p className="text-xs mt-1.5 text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p
          className={`text-xs mt-1.5 ${
            isDark ? "text-gray-500" : "text-gray-500"
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
