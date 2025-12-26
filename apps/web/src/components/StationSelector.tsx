interface Station {
  id: string;
  name: string;
}

interface StationSelectorProps {
  stations: Station[];
  onSelect: (stationId: string) => Promise<void>;
  loading?: boolean;
}

export function StationSelector({
  stations,
  onSelect,
  loading = false,
}: StationSelectorProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-xl dark:border dark:border-slate-800 p-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 mb-2 text-center">
        Pick your station
      </h2>
      <p className="text-gray-600 dark:text-slate-400 mb-6 text-center">
        Tap to claim and start working
      </p>
      <div className="grid gap-3">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => onSelect(station.id)}
            disabled={loading}
            className="w-full p-6 text-2xl font-semibold bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900 active:bg-blue-100 dark:active:bg-blue-800 border-2 border-gray-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-gray-900 dark:text-slate-50 rounded-xl transition-all shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "64px" }}
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-3xl">🔪</span>
              <span>{station.name}</span>
            </span>
          </button>
        ))}
      </div>
      {loading && (
        <p className="mt-4 text-center text-blue-600 dark:text-blue-400 font-medium">
          Claiming station...
        </p>
      )}
    </div>
  );
}
