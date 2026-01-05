import { useEffect, useState, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, captureError } from "@/lib";
import { usePrepEntryStore, usePrepStore } from "@/stores";
import { Pill } from "@/components/ui";
import { XIcon, CheckIcon } from "@/components/icons";

interface RecentItem {
  kitchen_item_id: string;
  description: string;
  last_quantity: number | null;
  last_unit_id: string | null;
  last_unit_name: string | null;
  last_used: string | null;
}

interface SelectedItem extends RecentItem {
  quantity: number | null;
  unit_id: string | null;
}

interface CopyRecentItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "copy-to-today" | "add-to-next-day";
  stationId: string;
  shiftId: string;
  targetDate: string;
  targetDateLabel: string;
  kitchenId: string;
  shiftDays: Map<number, { is_open: boolean; shift_ids: string[] }>;
}

interface PrepItemRow {
  kitchen_item_id: string;
  quantity: number | null;
  unit_id: string | null;
  created_at: string;
  kitchen_items: { name: string } | null;
  kitchen_units: { name: string } | null;
}

const UNIT_CATEGORIES = [
  { key: "pan", label: "Pans" },
  { key: "container", label: "Containers" },
  { key: "volume", label: "Volume" },
  { key: "weight", label: "Weight" },
  { key: "count", label: "Count" },
  { key: "prep", label: "Prep" },
  { key: "other", label: "Other" },
];

export function CopyRecentItemsModal({
  isOpen,
  onClose,
  stationId,
  shiftId,
  targetDate,
  targetDateLabel,
}: CopyRecentItemsModalProps) {
  const { allUnits } = usePrepEntryStore();

  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [targetDateItems, setTargetDateItems] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const title = `Add Items to ${targetDateLabel}`;

  // Fetch recent items for this station/shift AND items already on target date
  useEffect(() => {
    if (!isOpen || !stationId || !shiftId || !targetDate) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch both in parallel:
        // 1. All prep_items for this station+shift (for recent items list)
        // 2. Items already on the target date (for duplicate prevention)
        const [recentResponse, targetResponse] = await Promise.all([
          supabase
            .from("prep_items")
            .select(
              `
              kitchen_item_id,
              quantity,
              unit_id,
              created_at,
              kitchen_items(name),
              kitchen_units(name)
            `
            )
            .eq("station_id", stationId)
            .eq("shift_id", shiftId)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("prep_items")
            .select("kitchen_item_id")
            .eq("station_id", stationId)
            .eq("shift_id", shiftId)
            .eq("shift_date", targetDate),
        ]);

        if (recentResponse.error) {
          captureError(recentResponse.error, { context: "CopyRecentItemsModal.fetchRecentItems" });
          return;
        }

        // Build set of kitchen_item_ids already on target date
        const existingIds = new Set(
          (targetResponse.data || []).map((item) => item.kitchen_item_id)
        );
        setTargetDateItems(existingIds);

        // Dedupe by kitchen_item_id, keeping the most recent
        const seen = new Set<string>();
        const dedupedItems: RecentItem[] = [];

        for (const item of (recentResponse.data || []) as PrepItemRow[]) {
          if (!seen.has(item.kitchen_item_id)) {
            seen.add(item.kitchen_item_id);
            dedupedItems.push({
              kitchen_item_id: item.kitchen_item_id,
              description: item.kitchen_items?.name || "Unknown item",
              last_quantity: item.quantity,
              last_unit_id: item.unit_id,
              last_unit_name: item.kitchen_units?.name || null,
              last_used: item.created_at,
            });

            if (dedupedItems.length >= 200) break;
          }
        }

        setRecentItems(dedupedItems);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, stationId, shiftId, targetDate]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItems(new Map());
      setEditingItem(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingItem) {
          setEditingItem(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, editingItem]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return recentItems;
    const query = searchQuery.toLowerCase();
    return recentItems.filter((item) => item.description.toLowerCase().includes(query));
  }, [recentItems, searchQuery]);

  // Filter out items that are already on the target date
  const availableItems = useMemo(() => {
    return filteredItems.filter((item) => !targetDateItems.has(item.kitchen_item_id));
  }, [filteredItems, targetDateItems]);

  const handleToggleItem = useCallback((item: RecentItem) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      if (next.has(item.kitchen_item_id)) {
        next.delete(item.kitchen_item_id);
      } else {
        next.set(item.kitchen_item_id, {
          ...item,
          quantity: item.last_quantity,
          unit_id: item.last_unit_id,
        });
      }
      return next;
    });
  }, []);

  const handleUpdateQuantity = useCallback((kitchenItemId: string, quantity: string) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(kitchenItemId);
      if (item) {
        next.set(kitchenItemId, {
          ...item,
          quantity: quantity.trim() ? parseFloat(quantity) : null,
        });
      }
      return next;
    });
  }, []);

  const handleUpdateUnit = useCallback((kitchenItemId: string, unitId: string | null) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const item = next.get(kitchenItemId);
      if (item) {
        next.set(kitchenItemId, {
          ...item,
          unit_id: unitId,
        });
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (selectedItems.size === 0) return;

    setIsSaving(true);
    try {
      // Build all items to insert as a batch
      const itemsToAdd = Array.from(selectedItems.values()).map((item) => {
        const unitName = item.unit_id ? allUnits.find((u) => u.id === item.unit_id)?.name : null;
        let quantityRaw = "";
        if (item.quantity && unitName) {
          quantityRaw = `${item.quantity} ${unitName}`;
        } else if (unitName) {
          quantityRaw = unitName;
        } else if (item.quantity) {
          quantityRaw = item.quantity.toString();
        }

        return {
          station_id: stationId,
          shift_id: shiftId,
          shift_date: targetDate,
          kitchen_item_id: item.kitchen_item_id,
          unit_id: item.unit_id || null,
          quantity: item.quantity || null,
          quantity_raw: quantityRaw,
          status: "pending" as const,
        };
      });

      // Batch insert all items at once
      const { error } = await supabase.from("prep_items").insert(itemsToAdd);

      if (error) {
        captureError(error, { context: "CopyRecentItemsModal.addItems" });
      }

      // Reload prep items to show the new items
      await usePrepStore.getState().loadPrepItems(stationId, targetDate, shiftId);

      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const getUnitName = (unitId: string | null): string | null => {
    if (!unitId) return null;
    return allUnits.find((u) => u.id === unitId)?.name || null;
  };

  // Group units by category for the unit picker
  const groupedUnits = useMemo(() => {
    return UNIT_CATEGORIES.map(({ key, label }) => ({
      category: key,
      label,
      units: allUnits.filter((u) => u.category === key),
    })).filter((group) => group.units.length > 0);
  }, [allUnits]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-stone-200 dark:border-slate-700">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-50">{title}</h2>
              <p className="text-sm text-stone-500 dark:text-slate-400">
                Select items to add ({selectedItems.size} selected)
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-stone-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
            />
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : availableItems.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-stone-500 dark:text-slate-400">
                  {searchQuery
                    ? `No items found for "${searchQuery}"`
                    : recentItems.length === 0
                      ? "No recent items found for this station"
                      : "All recent items are already in the list"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-slate-800">
                {availableItems.map((item) => {
                  const isSelected = selectedItems.has(item.kitchen_item_id);
                  const selectedData = selectedItems.get(item.kitchen_item_id);
                  const isEditing = editingItem === item.kitchen_item_id;

                  return (
                    <div key={item.kitchen_item_id}>
                      <div
                        className={`px-5 py-3 flex items-center gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-orange-50 dark:bg-orange-900/20"
                            : "hover:bg-stone-50 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => handleToggleItem(item)}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? "bg-orange-500 text-white"
                              : "border-2 border-stone-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <CheckIcon size={14} />}
                        </div>

                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-900 dark:text-slate-50 truncate">
                            {item.description}
                          </p>
                          <p className="text-sm text-stone-500 dark:text-slate-400">
                            Last:{" "}
                            {item.last_quantity
                              ? `${item.last_quantity}${
                                  item.last_unit_name ? ` ${item.last_unit_name}` : ""
                                }`
                              : item.last_unit_name || "no quantity"}
                          </p>
                        </div>

                        {/* Edit button (only when selected) */}
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingItem(isEditing ? null : item.kitchen_item_id);
                            }}
                            className="px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                          >
                            {isEditing ? "Done" : "Edit"}
                          </button>
                        )}
                      </div>

                      {/* Expanded edit section */}
                      {isSelected && isEditing && selectedData && (
                        <div
                          className="px-5 py-4 bg-stone-50 dark:bg-slate-800/50 border-t border-stone-100 dark:border-slate-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Quantity input */}
                          <div className="mb-4">
                            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
                              Quantity
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                inputMode="decimal"
                                step="any"
                                placeholder="Amount"
                                value={selectedData.quantity?.toString() ?? ""}
                                onChange={(e) =>
                                  handleUpdateQuantity(item.kitchen_item_id, e.target.value)
                                }
                                className="flex-1 px-3 py-2 border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
                              />
                              {getUnitName(selectedData.unit_id) && (
                                <span className="px-2 py-2 bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 rounded-lg text-sm">
                                  {getUnitName(selectedData.unit_id)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Unit selector */}
                          <div>
                            <label className="block text-xs font-medium text-stone-500 dark:text-slate-400 mb-1.5">
                              Unit
                            </label>
                            <div className="max-h-40 overflow-y-auto rounded-lg border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
                              {/* Clear unit option */}
                              <button
                                onClick={() => handleUpdateUnit(item.kitchen_item_id, null)}
                                className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
                                  !selectedData.unit_id
                                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                    : "text-stone-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-700"
                                }`}
                              >
                                No unit
                              </button>

                              {groupedUnits.map(({ category, label, units }) => (
                                <div key={category} className="mt-2">
                                  <div className="text-xs font-medium text-stone-400 dark:text-slate-500 uppercase tracking-wider px-2 mb-1">
                                    {label}
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {units.map((unit) => (
                                      <Pill
                                        key={unit.id}
                                        variant={
                                          selectedData.unit_id === unit.id ? "selected" : "default"
                                        }
                                        size="sm"
                                        onClick={() =>
                                          handleUpdateUnit(item.kitchen_item_id, unit.id)
                                        }
                                      >
                                        {unit.name}
                                      </Pill>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-stone-200 dark:border-slate-700 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || selectedItems.size === 0}
              className="px-5 py-2.5 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isSaving
                ? "Adding..."
                : `Add ${selectedItems.size} item${selectedItems.size !== 1 ? "s" : ""}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
