import { useRef, useState, useEffect } from "react";
import type { KitchenUnit, RecencyScoredSuggestion } from "@kniferoll/types";
import { UnitPickerModal } from "./UnitPickerModal";

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
        .filter((s) => s.description.toLowerCase().includes(searchTerm))
        .filter((s) => s.description.toLowerCase() !== searchTerm) // Don't show exact matches
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
    setDescription(suggestion.description);
    if (suggestion.default_unit_id) {
      setSelectedUnitId(suggestion.default_unit_id);
    } else {
      setSelectedUnitId(null);
    }
    // Pre-fill quantity if last_quantity_used is available
    if (suggestion.last_quantity_used) {
      setQuantity(suggestion.last_quantity_used.toString());
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
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-10px);
            opacity: 0.5;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg dark:shadow-2xl p-3 space-y-2">
        {/* Suggestions Row */}
        {suggestions.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="flex items-center gap-0.5 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleSuggestionTap(suggestion)}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur
                  className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors whitespace-nowrap"
                >
                  {suggestion.description}
                </button>
                <button
                  type="button"
                  onClick={() => onDismissSuggestion(suggestion.id)}
                  className="px-1.5 py-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors text-xs"
                  title="Dismiss suggestion"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Input Row: Description + Quantity + Add */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={descriptionInputRef}
                type="text"
                placeholder="Item description..."
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700"
                required
                autoComplete="off"
              />

              {/* Autocomplete Dropdown */}
              {showAutocomplete && filteredAutocomplete.length > 0 && (
                <div
                  ref={autocompleteRef}
                  className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-500 rounded-lg shadow-lg dark:shadow-xl max-h-60 overflow-y-auto"
                >
                  {filteredAutocomplete.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionTap(suggestion)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-100 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
                    >
                      <div className="font-medium">
                        {suggestion.description}
                      </div>
                      {suggestion.last_quantity_used &&
                        suggestion.default_unit_id && (
                          <div className="text-sm text-gray-500 dark:text-slate-300">
                            Last used: {suggestion.last_quantity_used}{" "}
                            {
                              quickUnits.find(
                                (u) => u.id === suggestion.default_unit_id
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
              className="w-12 px-2 py-2 border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-400 dark:placeholder-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700 text-center"
            />

            <button
              type="submit"
              disabled={disabled || isLoading || !description.trim()}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap font-medium"
            >
              {isLoading ? "..." : "Add"}
            </button>
          </div>

          {/* Collapsible Units Row - Only shown when focused */}
          {isFormFocused && (
            <div className="flex gap-1.5">
              <div className="flex flex-wrap gap-1.5 max-h-18 overflow-hidden flex-1 lg:flex-nowrap lg:overflow-x-auto lg:max-h-6 scrollbar-hide">
                {orderedUnits.map((unit, index) => (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => handleQuickUnitTap(unit.id)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    disabled={disabled || isLoading}
                    style={{
                      animation:
                        selectedUnitId === unit.id && index === 0
                          ? "slideIn 0.3s ease-out"
                          : undefined,
                    }}
                    className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all duration-300 shrink-0 ${
                      selectedUnitId === unit.id
                        ? "bg-blue-600 dark:bg-blue-700 text-white"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600"
                    } disabled:opacity-50`}
                  >
                    {unit.name}
                  </button>
                ))}
              </div>

              {/* Add/Browse Units Button */}
              <button
                type="button"
                onClick={handleOpenUnitPicker}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
                disabled={disabled || isLoading}
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0 disabled:opacity-50"
              >
                +
              </button>
            </div>
          )}
        </form>

        {/* Unit Picker Modal */}
        {showUnitPicker && (
          <UnitPickerModal
            onClose={() => setShowUnitPicker(false)}
            onUnitSelected={handleUnitSelected}
          />
        )}
      </div>
    </>
  );
}
