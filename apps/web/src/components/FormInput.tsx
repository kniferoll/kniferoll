interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  minLength?: number;
  helperText?: string;
}

export function FormInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  required = true,
  minLength,
  helperText,
}: FormInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:focus:ring-blue-400"
        required={required}
        minLength={minLength}
      />
      {helperText && (
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
