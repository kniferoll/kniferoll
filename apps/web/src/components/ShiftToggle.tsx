interface ShiftToggleProps {
  shifts: string[];
  currentShift: string;
  onShiftChange: (shift: string) => void;
  disabled?: boolean;
}

export function ShiftToggle({
  shifts,
  currentShift,
  onShiftChange,
  disabled = false,
}: ShiftToggleProps) {
  if (disabled) {
    return (
      <div className="px-6 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-300">
        Kitchen Closed
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-lg border border-gray-300 bg-white flex-wrap">
      {shifts.map((shift, index) => (
        <button
          key={shift}
          onClick={() => onShiftChange(shift)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            index === 0 ? "rounded-l-lg" : ""
          } ${index === shifts.length - 1 ? "rounded-r-lg" : ""} ${
            currentShift === shift
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          {shift}
        </button>
      ))}
    </div>
  );
}
