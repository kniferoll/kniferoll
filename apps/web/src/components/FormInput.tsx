import { useDarkModeContext } from "../context/DarkModeContext";

interface FormInputProps {
  id?: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  helperText?: string;
}

/**
 * FormInput - styled input field that matches the Kniferoll design system.
 */
export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
  required = true,
  minLength,
  helperText,
}: FormInputProps) {
  const { isDark } = useDarkModeContext();
  const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <label
        htmlFor={inputId}
        className={`block text-sm font-medium mb-2 ${
          isDark ? "text-gray-300" : "text-gray-700"
        }`}
      >
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        className={`w-full px-4 py-3 rounded-xl border transition-all ${
          isDark
            ? "bg-slate-700/50 border-slate-600 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            : "bg-white border-stone-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      />
      {helperText && (
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
