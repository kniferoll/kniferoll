interface ProgressBarProps {
  completed: number;
  partial: number;
  pending: number;
}

export function ProgressBar({ completed, partial, pending }: ProgressBarProps) {
  const total = completed + partial + pending;
  const completedPercentage = total > 0 ? (completed / total) * 100 : 0;
  const partialPercentage = total > 0 ? (partial / total) * 100 : 0;
  const progressPercentage = completedPercentage + partialPercentage;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
        {completed > 0 && (
          <div
            className="bg-blue-500 h-2 transition-all"
            style={{ width: `${completedPercentage}%` }}
          />
        )}
        {partial > 0 && (
          <div
            className="bg-yellow-500 h-2 transition-all"
            style={{ width: `${partialPercentage}%` }}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          {completed > 0 && (
            <span className="text-gray-600 dark:text-slate-400">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {completed}
              </span>{" "}
              done
            </span>
          )}
          {partial > 0 && (
            <span className="text-gray-600 dark:text-slate-400">
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {partial}
              </span>{" "}
              working
            </span>
          )}
          {pending > 0 && (
            <span className="text-gray-600 dark:text-slate-400">
              <span className="font-medium">{pending}</span> todo
            </span>
          )}
        </div>
        <span className="text-gray-500 dark:text-slate-500 font-medium">
          {Math.round(progressPercentage)}%
        </span>
      </div>
    </div>
  );
}
