// src/components/kitchen/StepScheduleMode.tsx
import { useDarkModeContext } from "@/context";
import { DAYS, type DayOfWeek } from "./StepOperatingDays";

type ScheduleMode = "same" | "varies";

interface Schedule {
  [key: string]: string[];
}

interface StepScheduleModeProps {
  mode: ScheduleMode;
  onModeChange: (mode: ScheduleMode) => void;
  closedDays: DayOfWeek[];
  selectedShifts: string[];
  perDaySchedule: Schedule;
  onTogglePerDayShift: (day: DayOfWeek, shift: string) => void;
}

export function StepScheduleMode({
  mode,
  onModeChange,
  closedDays,
  selectedShifts,
  perDaySchedule,
  onTogglePerDayShift,
}: StepScheduleModeProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div>
      <h2
        className={`text-2xl font-bold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        How does your schedule work?
      </h2>
      <p className={`mb-6 cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Do you run the same shifts every day?
      </p>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => onModeChange("same")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            mode === "same"
              ? "border-orange-500 bg-orange-500/10"
              : isDark
                ? "border-slate-700 hover:border-slate-600"
                : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                Same every day
              </div>
              <div className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                All open days run the same shifts
              </div>
            </div>
            {mode === "same" && <span className="text-orange-500 text-2xl">✓</span>}
          </div>
        </button>

        <button
          onClick={() => onModeChange("varies")}
          className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
            mode === "varies"
              ? "border-orange-500 bg-orange-500/10"
              : isDark
                ? "border-slate-700 hover:border-slate-600"
                : "border-stone-200 hover:border-stone-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className={`font-semibold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
                Varies by day
              </div>
              <div className={`mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Configure each day separately
              </div>
            </div>
            {mode === "varies" && <span className="text-orange-500 text-2xl">✓</span>}
          </div>
        </button>
      </div>

      {/* Per-Day Configuration */}
      {mode === "varies" && (
        <div
          className={`border-t pt-6 space-y-4 ${isDark ? "border-slate-700" : "border-stone-200"}`}
        >
          <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
            Configure each day:
          </h3>
          {DAYS.map(({ key, label }) => {
            if (closedDays.includes(key)) {
              return (
                <div key={key} className="flex items-center justify-between py-2">
                  <span
                    className={`font-medium w-24 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    {label}
                  </span>
                  <span className={`italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                    Closed
                  </span>
                </div>
              );
            }

            return (
              <div key={key} className="flex items-start gap-3">
                <span
                  className={`font-medium w-24 pt-2 ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {label}
                </span>
                <div className="flex-1 flex flex-wrap gap-2">
                  {selectedShifts.map((shift) => (
                    <button
                      key={shift}
                      onClick={() => onTogglePerDayShift(key, shift)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                        perDaySchedule[key]?.includes(shift)
                          ? "bg-orange-500 text-white"
                          : isDark
                            ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                            : "bg-stone-100 text-gray-700 hover:bg-stone-200"
                      }`}
                    >
                      {perDaySchedule[key]?.includes(shift) && "✓ "}
                      {shift}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { type ScheduleMode, type Schedule };
