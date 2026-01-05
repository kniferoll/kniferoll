// src/components/kitchen/StepShifts.tsx
import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";

const PRESET_SHIFTS = ["Breakfast", "Lunch", "Dinner"];

interface StepShiftsProps {
  selectedShifts: string[];
  onToggleShift: (shift: string) => void;
  onAddCustomShift: (shift: string) => void;
  onReorderShifts: (shifts: string[]) => void;
}

export function StepShifts({
  selectedShifts,
  onToggleShift,
  onAddCustomShift,
  onReorderShifts,
}: StepShiftsProps) {
  const { isDark } = useDarkModeContext();
  const [customShift, setCustomShift] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number>(0);

  const handleAddCustom = () => {
    if (customShift.trim() && !selectedShifts.includes(customShift.trim())) {
      onAddCustomShift(customShift.trim());
      setCustomShift("");
    }
  };

  // Desktop drag handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newShifts = [...selectedShifts];
    const [draggedItem] = newShifts.splice(draggedIndex, 1);
    newShifts.splice(dropIndex, 0, draggedItem);

    onReorderShifts(newShifts);
    setDraggedIndex(null);
  };

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchDragIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    const itemHeight = 56; // Approximate height of each item
    const movement = Math.round(diff / itemHeight);

    if (movement !== 0) {
      const newIndex = touchDragIndex + movement;
      if (newIndex >= 0 && newIndex < selectedShifts.length && newIndex !== touchDragIndex) {
        const newShifts = [...selectedShifts];
        const [item] = newShifts.splice(touchDragIndex, 1);
        newShifts.splice(newIndex, 0, item);
        onReorderShifts(newShifts);
        setTouchDragIndex(newIndex);
        setTouchStartY(currentY);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchDragIndex(null);
  };

  return (
    <div>
      <h2
        className={`text-2xl font-bold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        What shifts do you run?
      </h2>
      <p className={`mb-6 cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Select your shifts and drag to reorder
      </p>

      {/* Preset Shifts */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESET_SHIFTS.map((shift) => {
          const isSelected = selectedShifts.includes(shift);
          return (
            <button
              key={shift}
              onClick={() => onToggleShift(shift)}
              className={`px-4 py-2 rounded-xl font-medium transition-all cursor-pointer ${
                isSelected
                  ? "bg-orange-500 text-white"
                  : isDark
                    ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                    : "bg-stone-100 text-gray-700 hover:bg-stone-200"
              }`}
            >
              {isSelected && "✓ "}
              {shift}
            </button>
          );
        })}
      </div>

      {/* Custom Shift Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <FormInput
            value={customShift}
            onChange={(e) => setCustomShift(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
            placeholder="Add custom shift..."
          />
        </div>
        <Button variant="secondary" onClick={handleAddCustom}>
          Add
        </Button>
      </div>

      {/* Selected Shifts (Draggable) */}
      {selectedShifts.length > 0 && (
        <div>
          <p
            className={`text-sm mb-3 cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Shift order (drag to reorder):
          </p>
          <div className="space-y-2">
            {selectedShifts.map((shift, index) => (
              <div
                key={shift}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all select-none ${
                  isDark
                    ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                    : "bg-white border-stone-200 hover:border-stone-300"
                } ${
                  draggedIndex === index || touchDragIndex === index ? "opacity-50 scale-95" : ""
                } ${touchDragIndex !== null ? "" : "cursor-move"}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    ⋮⋮
                  </span>
                  <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                    {shift}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleShift(shift);
                  }}
                  className="text-red-500 hover:text-red-600 text-sm font-medium cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { PRESET_SHIFTS };
