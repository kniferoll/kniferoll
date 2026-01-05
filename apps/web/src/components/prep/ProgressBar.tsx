import { memo } from "react";

interface ProgressBarProps {
  completed: number;
  partial: number;
  pending: number;
}

const ProgressBarInner = ({ completed, partial, pending }: ProgressBarProps) => {
  const total = completed + partial + pending;
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const partialPercent = total > 0 ? (partial / total) * 100 : 0;
  const displayPercent = Math.round(completedPercent);

  return (
    <div className="space-y-2">
      {/* Progress bar with two gradient segments: completed (emerald) + partial (amber) */}
      <div className="w-full bg-stone-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
        {completed > 0 && (
          <div
            className="bg-linear-to-r from-emerald-400 to-emerald-500 dark:from-emerald-600 dark:to-emerald-500 h-2 transition-all"
            style={{ width: `${completedPercent}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className="bg-linear-to-r from-amber-400 to-amber-500 dark:from-amber-600 dark:to-amber-500 h-2 transition-all"
            style={{ width: `${partialPercent}%` }}
          />
        )}
      </div>

      {/* Status text - matching StationCard style */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400">✓ {completed}</span>
          <span className="text-amber-600 dark:text-amber-400">◐ {partial}</span>
          <span className="text-stone-400 dark:text-slate-500">○ {pending}</span>
        </div>
        <span className="font-bold text-emerald-600 dark:text-emerald-400">{displayPercent}%</span>
      </div>
    </div>
  );
};

export const ProgressBar = memo(ProgressBarInner);
