import { useState, useEffect } from "react";
import type { PrepStatus } from "@kniferoll/types";

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

export function PrepItemList({
  items,
  onCycleStatus,
  onDelete,
  disabled = false,
  shouldSort = true,
}: PrepItemListProps) {
  // Maintain display order in local state
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);

  // Sort items when shouldSort is true, otherwise maintain current order
  useEffect(() => {
    if (shouldSort) {
      const sorted = [...items].sort((a, b) => {
        const statusOrder = { partial: 0, pending: 1, complete: 2 };
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

  const getStatusIcon = (status: PrepStatus | null) => {
    switch (status) {
      case "complete":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#3b82f6" />
            <path
              d="M8 12l3 3 5-5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        );
      case "partial":
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="#eab308" />
          </svg>
        );
      case "pending":
      default:
        return (
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" />
          </svg>
        );
    }
  };

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
              flex items-start gap-3 px-4 py-3 rounded-lg
              ${
                item.status === "partial"
                  ? "bg-yellow-50 dark:bg-yellow-950/20"
                  : "bg-white dark:bg-slate-900"
              }
              ${item.status === "complete" ? "opacity-70" : ""}
              dark:border dark:border-slate-800
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
              {getStatusIcon(item.status)}
            </button>

            {/* Description and Pill Container */}
            <div className="flex-1 min-w-0">
              {/* Desktop: inline description and pill */}
              <div className="sm:flex sm:items-center sm:gap-2">
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
              </div>
              {/* Mobile: pill below description */}
              {pillText && (
                <span
                  className={`
                    sm:hidden block mt-1
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

            {/* Delete Button */}
            <button
              onClick={() => {
                if (confirm("Delete this prep item?")) {
                  onDelete(item.id);
                }
              }}
              disabled={disabled}
              className="shrink-0 w-11 h-11 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
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
        );
      })}
    </div>
  );
}
