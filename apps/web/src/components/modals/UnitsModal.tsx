import { useEffect, useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useKitchenStore, usePrepEntryStore } from "@/stores";
import { supabase, captureError } from "@/lib";
import type { KitchenUnit } from "@kniferoll/types";
import { Pill } from "@/components/ui";
import { ChevronDownIcon, XIcon } from "@/components/icons";

interface UnitsModalProps {
  onClose: () => void;
  onUnitSelected: (unit: KitchenUnit) => void;
  selectedUnitId?: string | null;
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

export function UnitsModal({ onClose, onUnitSelected, selectedUnitId }: UnitsModalProps) {
  const { currentKitchen } = useKitchenStore();
  const { allUnits: storeUnits, addUnit } = usePrepEntryStore();
  const [allUnits, setAllUnits] = useState<KitchenUnit[]>(storeUnits);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[6]); // Default to "Other"
  const [isCreating, setIsCreating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const newUnitInputRef = useRef<HTMLInputElement>(null);

  // Use store units if available, otherwise fetch
  useEffect(() => {
    if (storeUnits.length > 0) {
      setAllUnits(storeUnits);
      return;
    }

    const fetchUnits = async () => {
      if (!currentKitchen?.id) return;

      const { data, error } = await supabase
        .from("kitchen_units")
        .select("*")
        .eq("kitchen_id", currentKitchen.id)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (!error && data) {
        setAllUnits(data);
      }
    };

    fetchUnits();
  }, [currentKitchen?.id, storeUnits]);

  // Focus search on open
  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  // Focus new unit input when create form opens
  useEffect(() => {
    if (showCreateForm) {
      setTimeout(() => newUnitInputRef.current?.focus(), 50);
    }
  }, [showCreateForm]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCreateForm) {
          setShowCreateForm(false);
          setNewUnitName("");
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose, showCreateForm]);

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

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !currentKitchen?.id || isCreating) return;

    setIsCreating(true);

    try {
      const { data, error } = await supabase
        .from("kitchen_units")
        .insert({
          kitchen_id: currentKitchen.id,
          name: newUnitName.trim(),
          category: selectedCategory.key,
        })
        .select()
        .single();

      if (!error && data) {
        setAllUnits((prev) => [...prev, data]);
        addUnit(data); // Update the store so other components see the new unit
        setNewUnitName("");
        setShowCreateForm(false);
        onUnitSelected(data);
      }
    } catch (err) {
      captureError(err as Error, { context: "UnitsModal.createUnit" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUnitClick = (unit: KitchenUnit) => {
    onUnitSelected(unit);
    onClose();
  };

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
          className="bg-white dark:bg-slate-900 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[60vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4">
            <h2 className="text-lg font-semibold text-stone-900 dark:text-slate-50">Select Unit</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <XIcon size={20} />
            </button>
          </div>

          {/* Search - only show when not in create form */}
          {!showCreateForm && (
            <div className="px-5 py-3 border-b border-stone-200 dark:border-slate-700">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search units..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-stone-200 dark:border-slate-600 bg-stone-50 dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {showCreateForm ? (
                <motion.form
                  key="create-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleCreateUnit}
                  className="p-5 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-2">
                      Unit Name
                    </label>
                    <input
                      ref={newUnitInputRef}
                      type="text"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                      placeholder="e.g., Red Cambro"
                      className="w-full px-4 py-2.5 border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 outline-none transition-all"
                    />
                  </div>
                  <Listbox value={selectedCategory} onChange={setSelectedCategory}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-stone-700 dark:text-slate-300 mb-2">
                        Category
                      </label>
                      <ListboxButton className="relative w-full cursor-pointer rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 py-2.5 pl-4 pr-10 text-left text-stone-900 dark:text-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 dark:focus:border-orange-400 transition-all">
                        <span className="block truncate">{selectedCategory.label}</span>
                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronDownIcon className="h-4 w-4 text-stone-400 dark:text-slate-500" />
                        </span>
                      </ListboxButton>

                      <ListboxOptions
                        anchor="top"
                        transition
                        className="z-60 mb-1 max-h-60 w-(--button-width) overflow-auto rounded-xl bg-white dark:bg-slate-800 py-1 text-sm border border-stone-200 dark:border-slate-600 shadow-lg focus:outline-none data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                      >
                        {CATEGORIES.map((category) => (
                          <ListboxOption
                            key={category.key}
                            value={category}
                            className="group relative cursor-pointer select-none py-2.5 pl-4 pr-9 text-stone-900 dark:text-slate-50 data-focus:bg-orange-500 data-focus:text-white"
                          >
                            <span className="block truncate font-normal group-data-selected:font-semibold">
                              {category.label}
                            </span>
                            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-orange-500 dark:text-orange-400 group-not-data-selected:hidden group-data-focus:text-white">
                              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                  fillRule="evenodd"
                                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={!newUnitName.trim() || isCreating}
                      className="flex-1 px-4 py-2.5 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                    >
                      {isCreating ? "Creating..." : "Create Unit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewUnitName("");
                      }}
                      className="flex-1 px-4 py-2.5 bg-stone-100 dark:bg-slate-700 text-stone-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="unit-list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-4"
                >
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
                      <p className="mb-3">No units found for "{searchQuery}"</p>
                      <button
                        onClick={() => {
                          setShowCreateForm(true);
                          setNewUnitName(searchQuery);
                        }}
                        className="text-orange-600 dark:text-orange-400 font-medium hover:underline"
                      >
                        Create "{searchQuery}" as a new unit
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer - Create button */}
          {!showCreateForm && (
            <div className="px-5 py-4 border-t border-stone-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setNewUnitName(searchQuery);
                }}
                className="w-full px-4 py-2.5 bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-200 rounded-xl text-sm font-semibold hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors"
              >
                + Create New Unit
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
