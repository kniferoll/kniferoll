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
  ) => Promise<void>;
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
  const [filteredAutocomplete, setFilteredAutocomplete] = useState<
    RecencyScoredSuggestion[]
  >([]);
  const descriptionInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const isSubmitting = useRef(false);

  // Filter autocomplete suggestions based on input
  useEffect(() => {
    if (description.trim().length > 0) {
      const searchTerm = description.toLowerCase().trim();
      const filtered = allSuggestions
        .filter((s) => s.description.toLowerCase().includes(searchTerm))
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
      // Select this unit
      setSelectedUnitId(unitId);
    }
  };

  // When the "+ " chip is tapped to open unit picker
  const handleOpenUnitPicker = () => {
    setShowUnitPicker(true);
  };

  // When a unit is selected from the picker modal
  const handleUnitSelected = (unit: KitchenUnit) => {
    setSelectedUnitId(unit.id);
    setShowUnitPicker(false);
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
      await onAddItem(description.trim(), selectedUnitId, parsedQuantity);

      // Clear form after successful submission
      setDescription("");
      setSelectedUnitId(null);
      setQuantity("");

      // Focus back to description for next item
      setTimeout(() => {
        descriptionInputRef.current?.focus();
      }, 0);
    } finally {
      isSubmitting.current = false;
    }
  };

  const selectedUnit = selectedUnitId
    ? quickUnits.find((u) => u.id === selectedUnitId) || {
        id: selectedUnitId,
        name: "Loading...",
      }
    : null;

  return (
    <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-sm dark:shadow-lg p-4 mb-6">
      {/* Suggestions Row */}
      {suggestions.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-center gap-1 shrink-0"
            >
              <button
                type="button"
                onClick={() => handleSuggestionTap(suggestion)}
                className="px-3 py-1 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
              >
                {suggestion.description}
              </button>
              <button
                type="button"
                onClick={() => onDismissSuggestion(suggestion.id)}
                className="px-2 py-1 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
                title="Dismiss suggestion"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={descriptionInputRef}
              type="text"
              placeholder="Item description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onFocus={() => {
                if (filteredAutocomplete.length > 0) {
                  setShowAutocomplete(true);
                }
              }}
              disabled={disabled || isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700"
              required
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {showAutocomplete && filteredAutocomplete.length > 0 && (
              <div
                ref={autocompleteRef}
                className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {filteredAutocomplete.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionTap(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-50 border-b border-gray-100 dark:border-slate-700 last:border-b-0 transition-colors"
                  >
                    <div className="font-medium">{suggestion.description}</div>
                    {suggestion.last_quantity_used &&
                      suggestion.default_unit_id && (
                        <div className="text-sm text-gray-500 dark:text-slate-400">
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
          <button
            type="submit"
            disabled={disabled || isLoading || !description.trim()}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoading ? "Adding..." : "Add"}
          </button>
        </div>

        {/* Quick Units Row */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickUnits.slice(0, 4).map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => handleQuickUnitTap(unit.id)}
              disabled={disabled || isLoading}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors shrink-0 ${
                selectedUnitId === unit.id
                  ? "bg-blue-600 dark:bg-blue-700 text-white"
                  : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
              } disabled:opacity-50`}
            >
              {unit.name}
            </button>
          ))}

          {/* Add/Browse Units Button */}
          <button
            type="button"
            onClick={handleOpenUnitPicker}
            disabled={disabled || isLoading}
            className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors shrink-0 disabled:opacity-50"
          >
            +
          </button>
        </div>

        {/* Optional Quantity Input */}
        {selectedUnit && (
          <div className="flex items-center gap-2">
            <input
              ref={quantityInputRef}
              type="number"
              placeholder="Qty"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={disabled || isLoading}
              className="w-20 px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:bg-gray-50 dark:disabled:bg-slate-700"
            />
            <span className="text-sm text-gray-600 dark:text-slate-400">
              {selectedUnit.name}
            </span>
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
  );
}
