import { ProgressBar } from "./ProgressBar";

interface StationCardProps {
  name: string;
  completed: number;
  total: number;
  onClick: () => void;
}

export function StationCard({
  name,
  completed,
  total,
  onClick,
}: StationCardProps) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-sm dark:shadow-lg p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow text-left"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
        {name}
      </h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-slate-50">
          {completed}/{total}
        </span>
        <span className="text-sm text-gray-600 dark:text-slate-400">
          {percentage}%
        </span>
      </div>

      <ProgressBar completed={completed} total={total} />
    </button>
  );
}
