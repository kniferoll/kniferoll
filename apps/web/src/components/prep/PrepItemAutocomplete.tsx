import { useState, useRef, useEffect } from "react";
import { useItemSuggestions, getLastQuantity } from "@/hooks";
import type { DbPrepItemSuggestion } from "@kniferoll/types";

type KitchenItemSuggestion = DbPrepItemSuggestion & { description?: string };

interface PrepItemAutocompleteProps {
  kitchenId: string | undefined;
  stationId: string | undefined;
  shiftName: string | undefined;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: KitchenItemSuggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PrepItemAutocomplete({
  kitchenId,
  stationId,
  shiftName,
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "e.g., Dice onions",
  disabled = false,
  autoFocus = false,
}: PrepItemAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { suggestions, loading } = useItemSuggestions(kitchenId, stationId, shiftName, value);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleSelectSuggestion = (suggestion: KitchenItemSuggestion) => {
    onChange(suggestion.description || "");
    setIsOpen(false);
    setHighlightedIndex(-1);

    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectSuggestion(suggestions[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
      />

      {isOpen && (suggestions.length > 0 || loading) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
          {loading ? (
            <div className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">
              Loading suggestions...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">
              No suggestions found
            </div>
          ) : (
            <ul className="max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const lastQty = getLastQuantity(suggestion);
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`px-4 py-2 cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <div className="font-medium">{suggestion.description}</div>
                    <div className="text-xs opacity-75">
                      {suggestion.use_count || 0} uses
                      {lastQty && ` • Last: ${lastQty}`}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
