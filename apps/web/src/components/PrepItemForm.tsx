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
      className="bg-white rounded-lg shadow-sm p-4 mb-6"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
        </div>
        <button
          type="submit"
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
