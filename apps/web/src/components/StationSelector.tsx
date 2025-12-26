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
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
        Pick your station
      </h2>
      <p className="text-gray-600 mb-6 text-center">
        Tap to claim and start working
      </p>
      <div className="grid gap-3">
        {stations.map((station) => (
          <button
            key={station.id}
            onClick={() => onSelect(station.id)}
            disabled={loading}
            className="w-full p-6 text-2xl font-semibold bg-gray-50 hover:bg-blue-50 active:bg-blue-100 border-2 border-gray-300 hover:border-blue-500 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
        <p className="mt-4 text-center text-blue-600 font-medium">
          Claiming station...
        </p>
      )}
    </div>
  );
}
