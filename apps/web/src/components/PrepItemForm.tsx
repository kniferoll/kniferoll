import { useRef } from "react";

interface PrepItemFormProps {
  description: string;
  quantity: string;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  disabled?: boolean;
}

export function PrepItemForm({
  description,
  quantity,
  onDescriptionChange,
  onQuantityChange,
  onSubmit,
  disabled = false,
}: PrepItemFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
    inputRef.current?.focus();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-sm dark:shadow-lg p-4 mb-6"
    >
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Item description..."
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700"
            required
          />
        </div>
        <div className="w-24">
          <input
            type="text"
            placeholder="Qty"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
