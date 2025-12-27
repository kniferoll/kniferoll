import { ProgressBar } from "./ProgressBar";

interface StationCardProps {
  name: string;
  completed: number;
  partial: number;
  pending: number;
  onClick: () => void;
}

export function StationCard({
  name,
  completed,
  partial,
  pending,
  onClick,
}: StationCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-sm dark:shadow-lg p-6 hover:shadow-md dark:hover:shadow-xl transition-shadow text-left"
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
        {name}
      </h3>

      <ProgressBar completed={completed} partial={partial} pending={pending} />
    </button>
  );
}
