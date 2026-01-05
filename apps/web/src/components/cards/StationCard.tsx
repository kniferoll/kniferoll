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
function StationCardInner({ name, completed, partial, pending, onClick }: StationCardProps) {
  const { isDark } = useDarkModeContext();

  const total = completed + partial + pending;
  const completedPercent = total === 0 ? 0 : (completed / total) * 100;
  const partialPercent = total === 0 ? 0 : (partial / total) * 100;
  const displayPercent = Math.round(completedPercent);

  return (
    <Card
      variant="interactive"
      padding="none"
      onClick={onClick}
      className="group relative p-6 text-left"
    >
      {/* Station Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-stone-900"}`}>
            {name}
          </h3>
          <p className={`text-xs mt-1 ${isDark ? "text-slate-500" : "text-stone-500"}`}>
            {total} items
          </p>
        </div>
        <div className={`text-lg font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
          {displayPercent}%
        </div>
      </div>

      {/* Progress Bar - two gradient segments */}
      <div
        className={`h-2 rounded-full overflow-hidden flex ${
          isDark ? "bg-slate-700" : "bg-stone-100"
        }`}
      >
        {completed > 0 && (
          <div
            className={`h-full bg-linear-to-r transition-all ${
              isDark ? "from-emerald-600 to-emerald-500" : "from-emerald-400 to-emerald-500"
            }`}
            style={{ width: `${completedPercent}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className={`h-full bg-linear-to-r transition-all ${
              isDark ? "from-amber-600 to-amber-500" : "from-amber-400 to-amber-500"
            }`}
            style={{ width: `${partialPercent}%` }}
          />
        )}
      </div>

      {/* Item Counts */}
      <div className="flex items-center gap-4 mt-4">
        <span className={`text-xs ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
          ✓ {completed}
        </span>
        <span className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>
          ◐ {partial}
        </span>
        <span className={`text-xs ${isDark ? "text-slate-500" : "text-stone-400"}`}>
          ○ {pending}
        </span>
      </div>

      {/* Hover Arrow */}
      <div
        className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isDark ? "text-slate-500" : "text-stone-400"
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Card>
  );
}

export const StationCard = memo(StationCardInner);
