import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { usePrepEntryStore } from "@/stores";
import type { KitchenUnit } from "@kniferoll/types";
import { Pill } from "@/components/ui";
import { XIcon } from "@/components/icons";

interface EditPrepItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quantity: number | null, unitId: string | null) => Promise<void>;
  itemDescription: string;
  initialQuantity: number | null;
  initialUnitId: string | null;
  initialUnitName: string | null;
}

const CATEGORIES = [
  { key: "pan", label: "Pans" },
  { key: "container", label: "Containers" },
  { key: "volume", label: "Volume" },
  { key: "weight", label: "Weight" },
  { key: "count", label: "Count" },
  { key: "prep", label: "Prep" },
  { key: "other", label: "Other" },
];

export function EditPrepItemModal({
  isOpen,
  onClose,
  onSave,
  itemDescription,
  initialQuantity,
  initialUnitId,
  initialUnitName,
}: EditPrepItemModalProps) {
  const { allUnits } = usePrepEntryStore();
  const [quantity, setQuantity] = useState(initialQuantity?.toString() ?? "");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(initialUnitId);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens with new data
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity?.toString() ?? "");
      setSelectedUnitId(initialUnitId);
      setSearchQuery("");
      setTimeout(() => quantityInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuantity, initialUnitId]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

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

  const filteredUnits = useMemo(() => {
    if (!searchQuery.trim()) return allUnits;
    const query = searchQuery.toLowerCase();
    return allUnits.filter(
      (unit) =>
        unit.name.toLowerCase().includes(query) || unit.display_name?.toLowerCase().includes(query)
    );
  }, [allUnits, searchQuery]);

  const groupedUnits = useMemo(() => {
    return CATEGORIES.map(({ key, label }) => ({
      category: key,
      label,
      units: filteredUnits.filter((u) => u.category === key),
    })).filter((group) => group.units.length > 0);
  }, [filteredUnits]);

  const handleUnitClick = (unit: KitchenUnit) => {
    if (selectedUnitId === unit.id) {
      setSelectedUnitId(null); // Deselect if clicking same unit
    } else {
      setSelectedUnitId(unit.id);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const parsedQuantity = quantity.trim() ? parseFloat(quantity) : null;
      await onSave(parsedQuantity, selectedUnitId);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    setQuantity("");
    setSelectedUnitId(null);
  };

  const selectedUnitName = allUnits.find((u) => u.id === selectedUnitId)?.name ?? initialUnitName;

  // Check if values have changed
  const hasChanges =
    (quantity.trim() ? parseFloat(quantity) : null) !== initialQuantity ||
    selectedUnitId !== initialUnitId;

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
          className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[70vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-stone-200 dark:border-slate-700">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-50 truncate">
                Edit Item
              </h2>
              <p className="text-sm text-stone-500 dark:text-slate-400 truncate">
                {itemDescription}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Quantity Input */}
          <div className="px-5 py-4 border-b border-stone-200 dark:border-slate-700">
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={quantityInputRef}
                type="number"
                inputMode="decimal"
                step="any"
                placeholder="Amount"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-base focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
              />
              {selectedUnitName && (
                <span className="px-3 py-2.5 bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-300 rounded-xl text-sm font-medium">
                  {selectedUnitName}
                </span>
              )}
            </div>
          </div>

          {/* Unit Search */}
          <div className="px-5 py-3 border-b border-stone-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
            />
          </div>

          {/* Units List */}
          <div className="flex-1 overflow-y-auto p-4">
            {groupedUnits.map(({ category, label, units }) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
                  {label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {units.map((unit) => (
                    <Pill
                      key={unit.id}
                      variant={selectedUnitId === unit.id ? "selected" : "default"}
                      size="md"
                      onClick={() => handleUnitClick(unit)}
                      title={unit.display_name || unit.name}
                    >
                      {unit.name}
                    </Pill>
                  ))}
                </div>
              </div>
            ))}

            {filteredUnits.length === 0 && searchQuery && (
              <div className="text-center py-8 text-stone-500 dark:text-slate-400">
                No units found for "{searchQuery}"
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-stone-200 dark:border-slate-700 flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2.5 text-stone-600 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 text-sm font-medium transition-colors"
            >
              Clear
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="px-5 py-2.5 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
