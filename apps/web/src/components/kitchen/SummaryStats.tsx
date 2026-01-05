import { useDarkModeContext } from "@/context";

interface SummaryStatsProps {
  completed: number;
  inProgress: number;
  pending: number;
}

/**
 * SummaryStats - displays aggregate counts for prep items.
 * Shows completed, in-progress, and pending totals.
 */
export function SummaryStats({ completed, inProgress, pending }: SummaryStatsProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div
      className={`grid grid-cols-3 gap-4 p-4 rounded-2xl cursor-default ${
        isDark
          ? "bg-slate-900/50 border border-slate-800"
          : "bg-white/60 border border-stone-200/50"
      }`}
    >
      <div className="text-center">
        <div className={`text-2xl font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
          {completed}
        </div>
        <div className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-stone-500"}`}>
          Completed
        </div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
          {inProgress}
        </div>
        <div className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-stone-500"}`}>
          In Progress
        </div>
      </div>
      <div className="text-center">
        <div className={`text-2xl font-bold ${isDark ? "text-slate-400" : "text-stone-600"}`}>
          {pending}
        </div>
        <div className={`text-xs font-medium ${isDark ? "text-slate-500" : "text-stone-500"}`}>
          Pending
        </div>
      </div>
    </div>
  );
}
