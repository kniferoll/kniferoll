// src/components/kitchen/StepOperatingDays.tsx
import { useDarkModeContext } from "@/context";

type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: "monday", label: "Mon", short: "M" },
  { key: "tuesday", label: "Tue", short: "T" },
  { key: "wednesday", label: "Wed", short: "W" },
  { key: "thursday", label: "Thu", short: "T" },
  { key: "friday", label: "Fri", short: "F" },
  { key: "saturday", label: "Sat", short: "S" },
  { key: "sunday", label: "Sun", short: "S" },
];

interface StepOperatingDaysProps {
  closedDays: DayOfWeek[];
  onToggleDay: (day: DayOfWeek) => void;
}

export function StepOperatingDays({ closedDays, onToggleDay }: StepOperatingDaysProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div>
      <h2
        className={`text-2xl font-bold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Which days are you open?
      </h2>
      <p className={`mb-6 cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Tap any day to mark it as closed
      </p>

      <div className="flex gap-2">
        {DAYS.map(({ key, label, short }) => {
          const isClosed = closedDays.includes(key);
          return (
            <button
              key={key}
              onClick={() => onToggleDay(key)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                isClosed
                  ? isDark
                    ? "bg-slate-700/50 text-gray-500 border border-slate-600"
                    : "bg-stone-100 text-gray-400 border border-stone-200"
                  : isDark
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                    : "bg-orange-100 text-orange-600 border border-orange-200"
              }`}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </button>
          );
        })}
      </div>

      <p className={`mt-3 text-xs cursor-default ${isDark ? "text-gray-500" : "text-gray-400"}`}>
        {closedDays.length === 0
          ? "Open every day"
          : `Closed: ${DAYS.filter((d) => closedDays.includes(d.key))
              .map((d) => d.label)
              .join(", ")}`}
      </p>
    </div>
  );
}

export { DAYS, type DayOfWeek };
