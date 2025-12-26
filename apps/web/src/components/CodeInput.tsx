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
    <div className="bg-white rounded-lg shadow-md p-8">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-4 text-center">
          Enter Kitchen Code
        </label>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-4xl font-bold px-4 py-6 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase tracking-widest"
          maxLength={6}
          placeholder="ABC123"
          autoComplete="off"
          inputMode="text"
        />
        {validating && (
          <div className="mt-4 text-center text-blue-600 font-medium">
            Validating...
          </div>
        )}
        <p className="mt-4 text-center text-sm text-gray-500">
          Code will validate automatically
        </p>
      </div>
    </div>
  );
}
