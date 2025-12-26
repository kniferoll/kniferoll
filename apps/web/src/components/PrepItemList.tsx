interface PrepItem {
  id: string;
  description: string;
  quantity_raw: string;
  completed: boolean | null;
}

interface PrepItemListProps {
  items: PrepItem[];
  onToggle: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  disabled?: boolean;
}

export function PrepItemList({
  items,
  onToggle,
  onDelete,
  disabled = false,
}: PrepItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-slate-400">No prep items yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-sm dark:shadow-lg p-4 flex items-center gap-3 hover:shadow-md dark:hover:shadow-xl transition-shadow"
        >
          <input
            type="checkbox"
            checked={item.completed || false}
            onChange={() => onToggle(item.id)}
            disabled={disabled}
            className="w-5 h-5 text-blue-600 dark:text-blue-500 rounded focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          />
          <div className="flex-1">
            <p
              className={`${
                item.completed
                  ? "line-through text-gray-400 dark:text-slate-500"
                  : "text-gray-900 dark:text-slate-50"
              }`}
            >
              {item.description}
              {item.quantity_raw && (
                <span className="text-gray-600 dark:text-slate-400 ml-2 text-sm">
                  ({item.quantity_raw})
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm("Delete this prep item?")) {
                onDelete(item.id);
              }
            }}
            disabled={disabled}
            className="text-gray-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
