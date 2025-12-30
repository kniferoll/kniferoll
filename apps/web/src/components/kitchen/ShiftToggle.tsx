import { useState, useRef, useEffect } from "react";
import { useDarkModeContext } from "@/context";

interface ShiftToggleProps {
  shifts: string[];
  currentShift: string;
  onShiftChange: (shift: string) => void;
  disabled?: boolean;
}

const MAX_VISIBLE_TABS = 4;

/**
 * ShiftToggle - pill-style segmented control for switching between shifts.
 * Shows up to 4 shifts inline, with overflow dropdown for additional shifts.
 */
export function ShiftToggle({
  shifts,
  currentShift,
  onShiftChange,
  disabled = false,
}: ShiftToggleProps) {
  const { isDark } = useDarkModeContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  if (disabled) {
    return (
      <div
        className={`px-6 py-2 text-sm font-medium rounded-xl border ${
          isDark
            ? "text-slate-400 bg-slate-800 border-slate-600"
            : "text-stone-500 bg-stone-100 border-stone-300"
        }`}
      >
        Kitchen Closed
      </div>
    );
  }

  const visibleShifts = shifts.slice(0, MAX_VISIBLE_TABS);
  const hiddenShifts = shifts.slice(MAX_VISIBLE_TABS);

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {/* Pill container */}
      <div
        className={`inline-flex p-1 rounded-xl ${
          isDark ? "bg-slate-800" : "bg-white shadow-sm border border-stone-200"
        }`}
      >
        {visibleShifts.map((shift) => (
          <button
            key={shift}
            onClick={() => onShiftChange(shift)}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              currentShift === shift
                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-slate-700"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
            }`}
          >
            {shift}
          </button>
        ))}
      </div>

      {/* Overflow dropdown */}
      {hiddenShifts.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-3 py-2 text-sm font-medium transition-all rounded-xl cursor-pointer ${
              dropdownOpen || hiddenShifts.includes(currentShift)
                ? "bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                : isDark
                ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                : "bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 border border-stone-200"
            }`}
          >
            +{hiddenShifts.length} more
          </button>

          {dropdownOpen && (
            <div
              className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-lg z-10 overflow-hidden ${
                isDark
                  ? "bg-slate-900 border-slate-700 shadow-slate-900/50"
                  : "bg-white border-stone-200 shadow-stone-900/10"
              }`}
            >
              {hiddenShifts.map((shift) => (
                <button
                  key={shift}
                  onClick={() => {
                    onShiftChange(shift);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    currentShift === shift
                      ? "bg-linear-to-r from-orange-500 to-orange-600 text-white"
                      : isDark
                      ? "text-slate-300 hover:bg-slate-800"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {shift}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
