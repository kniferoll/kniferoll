import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import type { KitchenUnit, RecencyScoredSuggestion } from "@kniferoll/types";
import { captureError } from "@/lib";
import { UnitsModal } from "@/components/modals/UnitsModal";
import { Pill } from "@/components/ui";
import { usePrepEntryStore } from "@/stores";

interface PrepItemEntryFormProps {
  suggestions: RecencyScoredSuggestion[];
  allSuggestions: RecencyScoredSuggestion[];
  quickUnits: KitchenUnit[];
  onAddItem: (
    description: string,
    unitId: string | null,
    quantity: number | null
  ) => Promise<{ error?: string } | void>;
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
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [orderedUnits, setOrderedUnits] = useState<KitchenUnit[]>([]);
  const [filteredAutocomplete, setFilteredAutocomplete] = useState<RecencyScoredSuggestion[]>([]);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);
  const isProgrammaticChange = useRef(false);

  // Get all units from store
  const { allUnits } = usePrepEntryStore();

  // Initialize ordered units from quickUnits
  useEffect(() => {
    if (quickUnits.length > 0 && orderedUnits.length === 0) {
      setOrderedUnits(quickUnits);
    }
  }, [quickUnits, orderedUnits.length]);

  // Smart unit ordering: prioritize unit matching current item being typed
  const smartOrderedUnits = useMemo(() => {
    if (!description.trim()) return orderedUnits;

    // Find matching suggestion for what's being typed
    const searchTerm = description.toLowerCase().trim();
    const matchingSuggestion = allSuggestions.find(
      (s) => (s.description || "").toLowerCase() === searchTerm
    );

    if (matchingSuggestion && matchingSuggestion.last_unit_id) {
      const lastUnitId = matchingSuggestion.last_unit_id;
      const lastUnit = allUnits.find((u) => u.id === lastUnitId);
      if (lastUnit) {
        // Move the last-used unit to the front
        const filtered = orderedUnits.filter((u) => u.id !== lastUnitId);
        const existsInOrdered = orderedUnits.some((u) => u.id === lastUnitId);
        if (existsInOrdered) {
          return [lastUnit, ...filtered];
        } else {
          return [lastUnit, ...orderedUnits.slice(0, 3)];
        }
      }
    }

    return orderedUnits;
  }, [description, orderedUnits, allSuggestions, allUnits]);

  // Visible units (max 3)
  const visibleUnits = smartOrderedUnits.slice(0, 3);

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
    if (suggestion.last_unit_id) {
      setSelectedUnitId(suggestion.last_unit_id);
    } else {
      setSelectedUnitId(null);
    }
    // Pre-fill quantity if last_quantity is available
    if (suggestion.last_quantity) {
      setQuantity(suggestion.last_quantity.toString());
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

  // When a quick unit pill is tapped
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

  // When a unit is selected from the modal
  const handleUnitSelected = (unit: KitchenUnit) => {
    setSelectedUnitId(unit.id);
    setShowUnitsModal(false);
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
      const result = await onAddItem(description.trim(), selectedUnitId, parsedQuantity);

      // Only clear form if submission was successful (no error returned)
      if (!result?.error) {
        setDescription("");
        setSelectedUnitId(null);
        setQuantity("");
        setIsFormFocused(false);
        setShowAutocomplete(false);
        setShowUnitsModal(false);

        // Focus back to description for next item
        setTimeout(() => {
          descriptionInputRef.current?.focus();
        }, 0);
      }
    } catch (error) {
      captureError(error as Error, { context: "PrepItemEntryForm.addItem" });
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <>
      {/* Autocomplete Dropdown - rendered above the form */}
      {showAutocomplete && filteredAutocomplete.length > 0 && (
        <div
          ref={autocompleteRef}
          className="mb-2 bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-600 rounded-xl shadow-lg dark:shadow-xl max-h-48 overflow-y-auto"
        >
          {filteredAutocomplete.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionTap(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
              className="w-full px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-slate-700 text-stone-900 dark:text-slate-100 border-b border-stone-100 dark:border-slate-700 last:border-b-0 transition-colors"
            >
              <div className="font-medium">{suggestion.description || "Unknown item"}</div>
              {suggestion.last_quantity && suggestion.last_unit_id && (
                <div className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                  Last: {suggestion.last_quantity}{" "}
                  {allUnits.find((u) => u.id === suggestion.last_unit_id)?.name}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
      <div
        className={`
          bg-white dark:bg-slate-900
          shadow-lg dark:shadow-2xl
          border border-stone-200 dark:border-slate-700
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isFormFocused ? "rounded-[20px]" : "rounded-2xl"}
        `}
      >
        {/* Suggestions Row */}
        {suggestions.length > 0 && (
          <div className="relative border-b border-stone-200 dark:border-slate-700">
            <div className="flex gap-2 overflow-x-auto pl-4 pr-12 py-3 scrollbar-hide">
              {suggestions.map((suggestion) => (
                <Pill
                  key={suggestion.id}
                  variant="suggestion"
                  onClick={() => handleSuggestionTap(suggestion)}
                  onMouseDown={(e) => e.preventDefault()}
                  onDismiss={() => onDismissSuggestion(suggestion.id)}
                >
                  {suggestion.description || "Unknown item"}
                </Pill>
              ))}
            </div>
            {/* Fade hint on right edge */}
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-white dark:from-slate-900 from-50% pointer-events-none" />
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
                className="w-full px-4 py-3 border-2 border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-[15px] outline-none transition-all duration-200 focus:border-stone-400 dark:focus:border-slate-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)] disabled:bg-stone-50 dark:disabled:bg-slate-700"
                required
                autoComplete="off"
              />
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
              className="w-14 px-2 py-3 border-2 border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-900 dark:text-slate-50 placeholder-stone-400 dark:placeholder-slate-400 rounded-xl text-[15px] text-center outline-none transition-all duration-200 focus:border-stone-400 dark:focus:border-slate-400 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] dark:focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)] disabled:bg-stone-50 dark:disabled:bg-slate-700"
            />

            <button
              type="submit"
              disabled={disabled || isLoading || !description.trim()}
              className="px-5 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-xl text-[15px] font-semibold whitespace-nowrap shadow-lg shadow-orange-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:bg-none disabled:bg-stone-300 disabled:dark:bg-slate-600 disabled:text-stone-500 disabled:dark:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100"
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
            style={{ overflow: "hidden" }}
          >
            <div className="relative flex items-center pb-3 pt-1">
              {/* Scrollable pills container */}
              <div className="flex gap-2 overflow-x-auto pl-4 pr-14 scrollbar-hide">
                {visibleUnits.map((unit) => (
                  <Pill
                    key={unit.id}
                    variant={selectedUnitId === unit.id ? "selected" : "default"}
                    onClick={() => handleQuickUnitTap(unit.id)}
                    onMouseDown={(e) => e.preventDefault()}
                    disabled={disabled || isLoading}
                    title={unit.name}
                  >
                    {unit.name}
                  </Pill>
                ))}
              </div>

              {/* Fixed overflow button on right */}
              <div className="absolute right-0 top-0 bottom-2 flex items-center pr-4 pl-3 bg-linear-to-l from-white dark:from-slate-900 from-80%">
                <Pill
                  variant="default"
                  onClick={() => setShowUnitsModal(true)}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={disabled || isLoading}
                >
                  •••
                </Pill>
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      {/* Units Modal */}
      {showUnitsModal && (
        <UnitsModal
          onClose={() => setShowUnitsModal(false)}
          onUnitSelected={handleUnitSelected}
          selectedUnitId={selectedUnitId}
        />
      )}
    </>
  );
}
