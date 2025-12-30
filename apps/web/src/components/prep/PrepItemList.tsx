import { useState, useEffect, memo } from "react";
import type { PrepStatus } from "@kniferoll/types";
import { StatusIcon, CheckIcon, TrashIcon, XIcon } from "@/components/icons";

interface PrepItem {
  id: string;
  description: string;
  quantity: number | null;
  unit_name?: string | null;
  status: PrepStatus | null;
  status_changed_by?: string | null;
  created_at: string | null;
}

interface PrepItemListProps {
  items: PrepItem[];
  onCycleStatus: (itemId: string) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  disabled?: boolean;
  shouldSort?: boolean;
}

function PrepItemListInner({
  items,
  onCycleStatus,
  onDelete,
  disabled = false,
  shouldSort = true,
}: PrepItemListProps) {
  // Maintain display order in local state
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  // Track which item is in delete confirmation mode
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Sort items when shouldSort is true, otherwise maintain current order
  useEffect(() => {
    if (shouldSort) {
      const sorted = [...items].sort((a, b) => {
        const statusOrder = { pending: 0, in_progress: 1, complete: 2 };
        const aStatus = a.status || "pending";
        const bStatus = b.status || "pending";

        const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
        if (statusDiff !== 0) return statusDiff;

        // Within same status, sort by created_at ascending
        if (!a.created_at || !b.created_at) return 0;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      setDisplayOrder(sorted.map((item) => item.id));
    } else {
      // When not sorting, add any new items to the end
      setDisplayOrder((prevOrder) => {
        const currentIds = new Set(prevOrder);
        const newItems = items.filter((item) => !currentIds.has(item.id));
        if (newItems.length > 0) {
          return [...prevOrder, ...newItems.map((item) => item.id)];
        }
        return prevOrder;
      });
    }
  }, [items, shouldSort]);

  // Initialize display order on first load
  useEffect(() => {
    if (displayOrder.length === 0 && items.length > 0) {
      setDisplayOrder(items.map((item) => item.id));
    }
  }, [items, displayOrder.length]);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-slate-400">No prep items yet</p>
      </div>
    );
  }

  // Create a map for quick item lookup
  const itemsMap = new Map(items.map((item) => [item.id, item]));

  // Build display items based on saved order, filtering out any that no longer exist
  const displayItems = displayOrder
    .map((id) => itemsMap.get(id))
    .filter((item): item is PrepItem => item !== undefined);

  const formatQuantityPill = (
    quantity: number | null,
    unitName: string | null
  ) => {
    if (!quantity && !unitName) return null;
    if (quantity && unitName) return `${quantity} ${unitName}`;
    if (quantity) return `${quantity}`;
    if (unitName) return unitName;
    return null;
  };

  return (
    <div className="space-y-2">
      {displayItems.map((item) => {
        const pillText = formatQuantityPill(
          item.quantity,
          item.unit_name || null
        );

        return (
          <div
            key={item.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg
              border border-gray-200 dark:border-slate-700
              shadow-sm
              ${
                item.status === "in_progress"
                  ? "bg-yellow-50 dark:bg-yellow-950/20"
                  : "bg-white dark:bg-slate-900"
              }
              ${item.status === "complete" ? "opacity-70" : ""}
            `.trim()}
          >
            {/* Status Icon - 48x48px tap target */}
            <button
              onClick={() => {
                if (!disabled) {
                  onCycleStatus(item.id);
                }
              }}
              disabled={disabled}
              className="shrink-0 w-12 h-12 flex items-center justify-center disabled:opacity-50"
              aria-label="Cycle status"
            >
              <StatusIcon status={item.status} size={24} />
            </button>

            {/* Description */}
            <div className="flex-1 min-w-0">
              {/* Mobile: description and pill stacked */}
              <div className="sm:hidden">
                <span
                  className={`block text-base ${
                    item.status === "complete"
                      ? "text-gray-400 dark:text-slate-500 line-through"
                      : "text-gray-900 dark:text-slate-50"
                  }`}
                >
                  {item.description}
                </span>
                {pillText && (
                  <span
                    className={`
                      block mt-1
                      px-2.5 py-1 rounded-full text-sm font-medium w-fit
                      ${
                        item.status === "complete"
                          ? "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                      }
                    `.trim()}
                  >
                    {pillText}
                  </span>
                )}
              </div>
              {/* Desktop: description only */}
              <span
                className={`hidden sm:block text-base ${
                  item.status === "complete"
                    ? "text-gray-400 dark:text-slate-500 line-through"
                    : "text-gray-900 dark:text-slate-50"
                }`}
              >
                {item.description}
              </span>
            </div>

            {/* Badge - Desktop only, right side */}
            {pillText && (
              <span
                className={`
                  hidden sm:inline-flex
                  px-2.5 py-1 rounded-full text-sm font-medium shrink-0
                  ${
                    item.status === "complete"
                      ? "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                  }
                `.trim()}
              >
                {pillText}
              </span>
            )}

            {/* Delete/Confirm Button */}
            {deletingItemId === item.id ? (
              <div className="shrink-0 flex items-center gap-1">
                {/* Confirm Delete */}
                <button
                  onClick={async () => {
                    await onDelete(item.id);
                    setDeletingItemId(null);
                  }}
                  disabled={disabled}
                  className="w-9 h-9 flex items-center justify-center text-green-500 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded transition-colors disabled:opacity-50"
                  aria-label="Confirm delete"
                >
                  <CheckIcon />
                </button>
                {/* Cancel Delete */}
                <button
                  onClick={() => setDeletingItemId(null)}
                  disabled={disabled}
                  className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors disabled:opacity-50"
                  aria-label="Cancel delete"
                >
                  <XIcon />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingItemId(item.id)}
                disabled={disabled}
                className="shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                aria-label="Delete"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const PrepItemList = memo(PrepItemListInner);
