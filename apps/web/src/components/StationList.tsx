interface StationListProps {
  stations: string[];
  onRemove: (index: number) => void;
  newStation: string;
  onNewStationChange: (value: string) => void;
  onAddStation: () => void;
}

export function StationList({
  stations,
  onRemove,
  newStation,
  onNewStationChange,
  onAddStation,
}: StationListProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddStation();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
        Stations
      </label>
      <div className="space-y-2 mb-3">
        {stations.map((station, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-50 rounded-lg">
              {station}
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newStation}
          onChange={(e) => onNewStationChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          placeholder="Add station..."
        />
        <button
          type="button"
          onClick={onAddStation}
          className="px-4 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-slate-50 rounded-lg font-medium transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
