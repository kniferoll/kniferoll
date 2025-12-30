import { memo } from "react";
import { useDarkModeContext } from "@/context";
import { Card } from "../ui/Card";

interface StationCardProps {
  name: string;
  completed: number;
  partial: number;
  pending: number;
  onClick: () => void;
}

/**
 * StationCard - displays a station with its prep progress.
 * Used in KitchenDashboard to show all stations in a grid.
 */
function StationCardInner({
  name,
  completed,
  partial,
  pending,
  onClick,
}: StationCardProps) {
  const { isDark } = useDarkModeContext();

  const total = completed + partial + pending;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const getProgressColor = () => {
    if (percent >= 80) return "from-emerald-500 to-emerald-600";
    if (percent >= 50) return "from-amber-500 to-orange-500";
    return "from-orange-500 to-orange-600";
  };

  const getPercentColor = () => {
    if (percent >= 80) return isDark ? "text-emerald-400" : "text-emerald-600";
    if (percent >= 50) return isDark ? "text-amber-400" : "text-amber-600";
    return isDark ? "text-orange-400" : "text-orange-600";
  };

  return (
    <Card
      variant="interactive"
      padding="none"
      onClick={onClick}
      className="group relative p-5 text-left"
    >
      {/* Station Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3
            className={`text-base font-semibold ${
              isDark ? "text-white" : "text-stone-900"
            }`}
          >
            {name}
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDark ? "text-slate-500" : "text-stone-500"
            }`}
          >
            {total} items
          </p>
        </div>
        <div className={`text-lg font-bold ${getPercentColor()}`}>
          {percent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className={`h-2 rounded-full overflow-hidden ${
          isDark ? "bg-slate-700" : "bg-stone-100"
        }`}
      >
        <div
          className={`h-full rounded-full bg-linear-to-r ${getProgressColor()} transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Item Counts */}
      <div className="flex items-center gap-4 mt-3">
        <span
          className={`text-xs ${
            isDark ? "text-emerald-400" : "text-emerald-600"
          }`}
        >
          ✓ {completed}
        </span>
        <span
          className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}
        >
          ◐ {partial}
        </span>
        <span
          className={`text-xs ${isDark ? "text-slate-500" : "text-stone-400"}`}
        >
          ○ {pending}
        </span>
      </div>

      {/* Hover Arrow */}
      <div
        className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isDark ? "text-slate-500" : "text-stone-400"
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Card>
  );
}

export const StationCard = memo(StationCardInner);
