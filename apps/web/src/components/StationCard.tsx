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
      className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{name}</h3>

      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-bold text-gray-900">
          {completed}/{total}
        </span>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>

      <ProgressBar completed={completed} total={total} />
    </button>
  );
}
