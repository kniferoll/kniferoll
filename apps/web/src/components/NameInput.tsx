import { useRef, useEffect } from "react";

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loading?: boolean;
}

export function NameInput({
  value,
  onChange,
  onSubmit,
  loading = false,
}: NameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-xl dark:border dark:border-slate-800 p-8">
      <form onSubmit={onSubmit}>
        <label className="block text-lg font-medium text-gray-700 dark:text-slate-300 mb-4 text-center">
          What should we call you?
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full text-center text-3xl px-4 py-6 border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          placeholder="Your name"
          autoComplete="name"
          required
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="w-full mt-6 bg-blue-600 dark:bg-blue-700 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800 dark:active:bg-blue-600"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Joining...
            </span>
          ) : (
            "Join Kitchen"
          )}
        </button>
      </form>
    </div>
  );
}
