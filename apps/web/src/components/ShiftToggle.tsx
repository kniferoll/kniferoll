import { useState } from "react";

interface ShiftToggleProps {
  shifts: string[];
  currentShift: string;
  onShiftChange: (shift: string) => void;
  disabled?: boolean;
}

const MAX_VISIBLE_TABS = 4;

export function ShiftToggle({
  shifts,
  currentShift,
  onShiftChange,
  disabled = false,
}: ShiftToggleProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (disabled) {
    return (
      <div className="px-6 py-2 text-sm font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-300 dark:border-slate-600">
        Kitchen Closed
      </div>
    );
  }

  const visibleShifts = shifts.slice(0, MAX_VISIBLE_TABS);
  const hiddenShifts = shifts.slice(MAX_VISIBLE_TABS);

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
        {visibleShifts.map((shift, index) => (
          <button
            key={shift}
            onClick={() => onShiftChange(shift)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              index === 0 ? "rounded-l-lg" : ""
            } ${
              index === visibleShifts.length - 1 && hiddenShifts.length === 0
                ? "rounded-r-lg"
                : ""
            } ${
              currentShift === shift
                ? "bg-blue-600 dark:bg-blue-700 text-white"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            }`}
          >
            {shift}
          </button>
        ))}
      </div>

      {hiddenShifts.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`px-3 py-2 text-sm font-medium transition-colors rounded-lg border ${
              dropdownOpen || hiddenShifts.includes(currentShift)
                ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-600 dark:border-blue-700"
                : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-300 dark:border-slate-600"
            }`}
          >
            +{hiddenShifts.length} more
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-lg dark:shadow-xl z-10">
              {hiddenShifts.map((shift) => (
                <button
                  key={shift}
                  onClick={() => {
                    onShiftChange(shift);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    currentShift === shift
                      ? "bg-blue-600 dark:bg-blue-700 text-white"
                      : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                  } first:rounded-t-lg last:rounded-b-lg`}
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
