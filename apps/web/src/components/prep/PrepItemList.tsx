import { useState, useEffect, useRef, memo } from "react";
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
  isCompact?: boolean;
}

type AnimationState = "adding" | "completing" | "sorting" | "deleting" | null;

function PrepItemListInner({
  items,
  onCycleStatus,
  onDelete,
  disabled = false,
  shouldSort = false,
  isCompact = false,
}: PrepItemListProps) {
  // Maintain display order in local state - items stay in place until explicit sort
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  // Track which item is in delete confirmation mode
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  // Track whether initial load has happened
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  // Track animation states per item
  const [animatingItems, setAnimatingItems] = useState<Map<string, AnimationState>>(new Map());
  // Track previous item statuses to detect status changes
  const prevStatusRef = useRef<Map<string, PrepStatus | null>>(new Map());

  // Helper to set animation for an item
  const setItemAnimation = (itemId: string, animation: AnimationState) => {
    setAnimatingItems((prev) => {
      const next = new Map(prev);
      if (animation) {
        next.set(itemId, animation);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  // Clear animation after it completes
  const clearAnimationAfterDelay = (itemId: string, delay: number) => {
    setTimeout(() => {
      setAnimatingItems((prev) => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }, delay);
  };

  // Handle explicit sort request via shouldSort prop
  useEffect(() => {
    if (shouldSort && items.length > 0) {
      const sorted = [...items].sort((a, b) => {
        const statusOrder = { pending: 0, in_progress: 1, complete: 2 };
        const aStatus = a.status || "pending";
        const bStatus = b.status || "pending";

        const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
        if (statusDiff !== 0) return statusDiff;

        return a.description.localeCompare(b.description);
      });
      setDisplayOrder(sorted.map((item) => item.id));
      // Animate all items with sorting animation
      sorted.forEach((item, index) => {
        setTimeout(() => {
          setItemAnimation(item.id, "sorting");
          clearAnimationAfterDelay(item.id, 400);
        }, index * 50);
      });
    }
  }, [shouldSort]);

  // Handle new items being added or removed
  useEffect(() => {
    if (items.length === 0) {
      setDisplayOrder([]);
      setInitialLoadDone(false);
      prevStatusRef.current = new Map();
      return;
    }

    // Initial load: sort by status then created_at
    if (!initialLoadDone) {
      const sorted = [...items].sort((a, b) => {
        const statusOrder = { pending: 0, in_progress: 1, complete: 2 };
        const aStatus = a.status || "pending";
        const bStatus = b.status || "pending";

        const statusDiff = statusOrder[aStatus] - statusOrder[bStatus];
        if (statusDiff !== 0) return statusDiff;

        if (!a.created_at || !b.created_at) return 0;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      setDisplayOrder(sorted.map((item) => item.id));
      // Initialize status tracking
      prevStatusRef.current = new Map(items.map((item) => [item.id, item.status]));
      setInitialLoadDone(true);
      return;
    }

    // After initial load: preserve order, add new items at top
    setDisplayOrder((prevOrder) => {
      const existingIds = new Set(items.map((item) => item.id));
      const prevIds = new Set(prevOrder);

      // Find new items
      const newItems = items.filter((item) => !prevIds.has(item.id));

      // Animate new items
      newItems.forEach((item) => {
        setItemAnimation(item.id, "adding");
        clearAnimationAfterDelay(item.id, 400);
      });

      // Filter out deleted items
      const remainingOrder = prevOrder.filter((id) => existingIds.has(id));

      return [...newItems.map((item) => item.id), ...remainingOrder];
    });

    // Detect status changes for completing animation
    items.forEach((item) => {
      const prevStatus = prevStatusRef.current.get(item.id);
      if (prevStatus !== undefined && prevStatus !== item.status) {
        // Status changed - if now complete, animate
        if (item.status === "complete") {
          setItemAnimation(item.id, "completing");
          clearAnimationAfterDelay(item.id, 500);
        }
      }
    });

    // Update status tracking
    prevStatusRef.current = new Map(items.map((item) => [item.id, item.status]));
  }, [items, initialLoadDone]);

  // Handle delete with animation
  const handleDeleteWithAnimation = async (itemId: string) => {
    setItemAnimation(itemId, "deleting");
    // Wait for animation then actually delete
    setTimeout(async () => {
      await onDelete(itemId);
      setDeletingItemId(null);
      setAnimatingItems((prev) => {
        const next = new Map(prev);
        next.delete(itemId);
        return next;
      });
    }, 300);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-600 dark:text-slate-400">No prep items yet</p>
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

  // Compact vs normal sizing
  const itemPadding = isCompact ? "px-3 py-2" : "px-4 py-3";
  const itemGap = isCompact ? "gap-2" : "gap-3";
  const statusButtonSize = isCompact ? "w-9 h-9" : "w-12 h-12";
  const statusIconSize = isCompact ? 20 : 24;
  const textSize = isCompact ? "text-sm" : "text-base";
  const pillSize = isCompact ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  const deleteButtonSize = isCompact ? "w-8 h-8" : "w-11 h-11";
  const confirmButtonSize = isCompact ? "w-7 h-7" : "w-9 h-9";

  // Get animation class for an item
  const getAnimationClass = (itemId: string) => {
    const animation = animatingItems.get(itemId);
    switch (animation) {
      case "adding":
        return "animate-itemSlideIn";
      case "completing":
        return "animate-itemComplete";
      case "sorting":
        return "animate-itemSort";
      case "deleting":
        return "animate-itemDelete";
      default:
        return "";
    }
  };

  return (
    <div className={`${isCompact ? "space-y-1.5" : "space-y-2"} overflow-x-hidden`}>
      {displayItems.map((item) => {
        const pillText = formatQuantityPill(
          item.quantity,
          item.unit_name || null
        );
        const isDeleting = deletingItemId === item.id;
        const animationClass = getAnimationClass(item.id);

        return (
          <div
            key={item.id}
            className={`
              flex items-center ${itemGap} ${itemPadding} rounded-xl
              border border-stone-200 dark:border-slate-700
              shadow-sm
              ${
                item.status === "in_progress"
                  ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50"
                  : "bg-white dark:bg-slate-900"
              }
              ${item.status === "complete" ? "opacity-60" : ""}
              ${animationClass}
            `.trim()}
            style={{ transformOrigin: "top center" }}
          >
            {/* Status Icon */}
            <button
              onClick={() => {
                if (!disabled) {
                  onCycleStatus(item.id);
                }
              }}
              disabled={disabled}
              className={`shrink-0 ${statusButtonSize} flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform disabled:opacity-50`}
              aria-label="Cycle status"
            >
              <StatusIcon status={item.status} size={statusIconSize} />
            </button>

            {/* Description */}
            <div className="flex-1 min-w-0">
              {/* Mobile: description and pill stacked */}
              <div className="sm:hidden">
                <span
                  className={`block ${textSize} font-medium ${
                    item.status === "complete"
                      ? "text-stone-400 dark:text-slate-500 line-through"
                      : "text-stone-900 dark:text-slate-50"
                  }`}
                >
                  {item.description}
                </span>
                {pillText && (
                  <span
                    className={`
                      inline-block mt-1
                      ${pillSize} rounded-full font-medium
                      ${
                        item.status === "complete"
                          ? "bg-stone-200 dark:bg-slate-700 text-stone-400 dark:text-slate-500"
                          : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
                      }
                    `.trim()}
                  >
                    {pillText}
                  </span>
                )}
              </div>
              {/* Desktop: description only */}
              <span
                className={`hidden sm:block ${textSize} font-medium ${
                  item.status === "complete"
                    ? "text-stone-400 dark:text-slate-500 line-through"
                    : "text-stone-900 dark:text-slate-50"
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
                  ${pillSize} rounded-full font-medium shrink-0
                  ${
                    item.status === "complete"
                      ? "bg-stone-200 dark:bg-slate-700 text-stone-400 dark:text-slate-500"
                      : "bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400"
                  }
                `.trim()}
              >
                {pillText}
              </span>
            )}

            {/* Delete/Confirm Button */}
            {isDeleting ? (
              <div className="shrink-0 flex items-center gap-0.5 animate-confirmSlideIn">
                {/* Confirm Delete */}
                <button
                  onClick={() => handleDeleteWithAnimation(item.id)}
                  disabled={disabled}
                  className={`${confirmButtonSize} flex items-center justify-center text-green-500 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors disabled:opacity-50`}
                  aria-label="Confirm delete"
                >
                  <CheckIcon size={isCompact ? 14 : 18} />
                </button>
                {/* Cancel Delete */}
                <button
                  onClick={() => setDeletingItemId(null)}
                  disabled={disabled}
                  className={`${confirmButtonSize} flex items-center justify-center text-stone-400 dark:text-slate-500 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50`}
                  aria-label="Cancel delete"
                >
                  <XIcon size={isCompact ? 14 : 18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeletingItemId(item.id)}
                disabled={disabled}
                className={`shrink-0 ${deleteButtonSize} flex items-center justify-center text-stone-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50`}
                aria-label="Delete"
              >
                <TrashIcon size={isCompact ? 16 : 18} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const PrepItemList = memo(PrepItemListInner);
