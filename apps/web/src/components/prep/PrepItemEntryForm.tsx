import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { KitchenUnit, RecencyScoredSuggestion } from "@kniferoll/types";
import { UnitPickerModal } from "@/components/modals/UnitPickerModal";

interface PrepItemEntryFormProps {
  suggestions: RecencyScoredSuggestion[];
  allSuggestions: RecencyScoredSuggestion[];
  quickUnits: KitchenUnit[];
  onAddItem: (
    description: string,
    unitId: string | null,
    quantity: number | null
  ) => Promise<{ error?: any } | void>;
  onDismissSuggestion: (suggestionId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function PrepItemEntryForm({
  suggestions,
  allSuggestions,
  quickUnits,
  onAddItem,
  onDismissSuggestion,
  disabled = false,
  isLoading = false,
}: PrepItemEntryFormProps) {
  const [description, setDescription] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [showUnitPicker, setShowUnitPicker] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [orderedUnits, setOrderedUnits] = useState<KitchenUnit[]>([]);
  const [filteredAutocomplete, setFilteredAutocomplete] = useState<
    RecencyScoredSuggestion[]
  >([]);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);
  const isProgrammaticChange = useRef(false);

  // Initialize ordered units from quickUnits
  useEffect(() => {
    if (quickUnits.length > 0 && orderedUnits.length === 0) {
      setOrderedUnits(quickUnits);
    }
  }, [quickUnits, orderedUnits.length]);

  // Filter autocomplete suggestions based on input
  useEffect(() => {
    // Don't show autocomplete if this was a programmatic change (from selecting a suggestion)
    if (isProgrammaticChange.current) {
      isProgrammaticChange.current = false;
      return;
    }

    if (description.trim().length > 0) {
      const searchTerm = description.toLowerCase().trim();
      const filtered = allSuggestions
        .filter((s) => (s.description || "").toLowerCase().includes(searchTerm))
        .filter((s) => (s.description || "").toLowerCase() !== searchTerm) // Don't show exact matches
        .slice(0, 5); // Limit to 5 results
      setFilteredAutocomplete(filtered);
      setShowAutocomplete(filtered.length > 0);
    } else {
      setFilteredAutocomplete([]);
      setShowAutocomplete(false);
    }
  }, [description, allSuggestions]);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node) &&
        !descriptionInputRef.current?.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // When a suggestion is tapped (from quick suggestions or autocomplete)
  const handleSuggestionTap = (suggestion: RecencyScoredSuggestion) => {
    // Mark this as a programmatic change to prevent autocomplete from reopening
    isProgrammaticChange.current = true;
    setDescription(suggestion.description || "");
    // Use last_unit_id from prep_item_suggestions
    if ((suggestion as any).last_unit_id) {
      setSelectedUnitId((suggestion as any).last_unit_id);
    } else {
      setSelectedUnitId(null);
    }
    // Pre-fill quantity if last_quantity is available
    if ((suggestion as any).last_quantity) {
      setQuantity((suggestion as any).last_quantity.toString());
    } else {
      setQuantity("");
    }
    // Hide autocomplete
    setShowAutocomplete(false);
    // Keep form focused to show units
    setIsFormFocused(true);
    // Focus quantity input
    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 0);
  };

  // When a quick unit chip is tapped
  const handleQuickUnitTap = (unitId: string) => {
    if (selectedUnitId === unitId) {
      // Deselect if already selected
      setSelectedUnitId(null);
    } else {
      // Select this unit and move to front
      setSelectedUnitId(unitId);
      setOrderedUnits((prev) => {
        const unit = prev.find((u) => u.id === unitId);
        if (!unit) return prev;
        const filtered = prev.filter((u) => u.id !== unitId);
        return [unit, ...filtered];
      });
    }
  };

  // When the "+ " chip is tapped to open unit picker
  const handleOpenUnitPicker = () => {
    setShowUnitPicker(true);
    setIsFormFocused(true);
  };

  // When a unit is selected from the picker modal
  const handleUnitSelected = (unit: KitchenUnit) => {
    setSelectedUnitId(unit.id);
    setShowUnitPicker(false);
    setIsFormFocused(true);

    // Add unit to front of ordered list if not already present
    setOrderedUnits((prev) => {
      const exists = prev.find((u) => u.id === unit.id);
      if (exists) {
        // Move to front
        const filtered = prev.filter((u) => u.id !== unit.id);
        return [unit, ...filtered];
      } else {
        // Add to front
        return [unit, ...prev];
      }
    });

    setTimeout(() => {
      quantityInputRef.current?.focus();
    }, 0);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || isSubmitting.current) {
      return;
    }

    isSubmitting.current = true;

    try {
      const parsedQuantity = quantity ? parseFloat(quantity) : null;
      const result = await onAddItem(
        description.trim(),
        selectedUnitId,
        parsedQuantity
      );

      // Only clear form if submission was successful (no error returned)
      if (!result?.error) {
        setDescription("");
        setSelectedUnitId(null);
        setQuantity("");
        setIsFormFocused(false);
        setShowAutocomplete(false);
        setShowUnitPicker(false);

        // Focus back to description for next item
        setTimeout(() => {
          descriptionInputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <>
      <div
        className={`
          bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl
          shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]
          border border-stone-200 dark:border-slate-700
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isFormFocused ? "rounded-[20px]" : "rounded-2xl"}
        `}
      >
        {/* Suggestions Row */}
        {suggestions.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-stone-200 dark:border-slate-700 scrollbar-hide">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSuggestionTap(suggestion)}
                onMouseDown={(e) => e.preventDefault()}
                className="group flex items-center gap-1 shrink-0 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 active:scale-[0.97] transition-all duration-200 whitespace-nowrap"
              >
                {suggestion.description || "Unknown item"}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismissSuggestion(suggestion.id);
                  }}
                  className="flex items-center justify-center w-4 h-4 ml-0.5 -mr-1 text-blue-300 dark:text-blue-500 group-hover:text-blue-500 dark:group-hover:text-blue-300 group-hover:bg-blue-200/50 dark:group-hover:bg-blue-700/50 rounded-full transition-all text-xs"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          {/* Input Row: Description + Quantity + Add */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="flex-1 relative">
              <input
                ref={descriptionInputRef}
                type="text"
                placeholder="Add prep item..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={() => {
                  setIsFormFocused(true);
                  if (filteredAutocomplete.length > 0) {
                    setShowAutocomplete(true);
                  }
                }}
                onBlur={() => {
                  setIsFormFocused(false);
                }}
                disabled={disabled || isLoading}
                className="w-full px-4 py-3 border-2 border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-[15px] outline-none transition-all duration-200 focus:border-indigo-500 dark:focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] disabled:bg-stone-50 dark:disabled:bg-slate-700"
                required
                autoComplete="off"
              />

              {/* Autocomplete Dropdown */}
              {showAutocomplete && filteredAutocomplete.length > 0 && (
                <div
                  ref={autocompleteRef}
                  className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl shadow-lg dark:shadow-xl max-h-48 overflow-y-auto z-50 animate-slideDown"
                >
                  {filteredAutocomplete.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionTap(suggestion)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-900 dark:text-slate-100 border-b border-stone-100 dark:border-slate-700 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">
                        {(suggestion as any).description || "Unknown item"}
                      </div>
                      {(suggestion as any).last_quantity &&
                        (suggestion as any).last_unit_id && (
                          <div className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                            Last: {(suggestion as any).last_quantity}{" "}
                            {
                              quickUnits.find(
                                (u) => u.id === (suggestion as any).last_unit_id
                              )?.name
                            }
                          </div>
                        )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Inline Quantity Input */}
            <input
              ref={quantityInputRef}
              type="number"
              placeholder="#"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onFocus={() => setIsFormFocused(true)}
              onBlur={() => setIsFormFocused(false)}
              disabled={disabled || isLoading}
              className="w-14 px-2 py-3 border-2 border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-[15px] text-center outline-none transition-all duration-200 focus:border-indigo-500 dark:focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] disabled:bg-stone-50 dark:disabled:bg-slate-700"
            />

            <button
              type="submit"
              disabled={disabled || isLoading || !description.trim()}
              className="px-5 py-3 bg-indigo-500 dark:bg-indigo-600 text-white rounded-xl text-[15px] font-semibold whitespace-nowrap transition-all duration-200 hover:bg-indigo-600 dark:hover:bg-indigo-500 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
            >
              {isLoading ? "..." : "Add"}
            </button>
          </div>

          {/* Collapsible Units Row - Animates in when focused */}
          <motion.div
            initial={false}
            animate={{
              height: isFormFocused ? "auto" : 0,
              opacity: isFormFocused ? 1 : 0,
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-4 pb-3 pt-1 overflow-x-auto scrollbar-hide">
              {orderedUnits.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => handleQuickUnitTap(unit.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={disabled || isLoading}
                  className={`
                    px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0
                    transition-all duration-200
                    ${
                      selectedUnitId === unit.id
                        ? "bg-indigo-500 dark:bg-indigo-600 text-white"
                        : "bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-600"
                    }
                    disabled:opacity-50
                  `}
                >
                  {unit.name}
                </button>
              ))}

              {/* Add/Browse Units Button */}
              <button
                type="button"
                onClick={handleOpenUnitPicker}
                onMouseDown={(e) => e.preventDefault()}
                disabled={disabled || isLoading}
                className="px-3 py-1.5 rounded-full text-sm font-semibold bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors shrink-0 disabled:opacity-50"
              >
                +
              </button>
            </div>
          </motion.div>
        </form>
      </div>

      {/* Unit Picker Modal */}
      {showUnitPicker && (
        <UnitPickerModal
          onClose={() => setShowUnitPicker(false)}
          onUnitSelected={handleUnitSelected}
        />
      )}
    </>
  );
}
