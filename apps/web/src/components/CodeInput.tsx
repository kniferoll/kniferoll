import { useRef, useEffect } from "react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  validating?: boolean;
  onSubmit?: () => void;
}

export function CodeInput({
  value,
  onChange,
  validating = false,
  onSubmit,
}: CodeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSubmit) {
      onSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-xl dark:border dark:border-slate-800 p-8">
      <div>
        <label className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-4 text-center">
          Enter Kitchen Code
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-4xl font-bold px-4 py-6 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent uppercase tracking-widest"
          maxLength={6}
          placeholder="ABC123"
          autoComplete="off"
          inputMode="text"
        />
        {validating && (
          <div className="mt-4 text-center text-blue-600 dark:text-blue-400 font-medium">
            Validating...
          </div>
        )}
        <p className="mt-4 text-center text-sm text-gray-500 dark:text-slate-400">
          Code will validate automatically
        </p>
      </div>
    </div>
  );
}
