// src/components/kitchen/StepStations.tsx
import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";

const DEFAULT_STATIONS = ["Garde Manger", "Grill", "Sauté", "Pastry", "Prep"];

interface StepStationsProps {
  stations: string[];
  onAddStation: (station: string) => void;
  onRemoveStation: (index: number) => void;
  maxStations?: number;
  onUpgradeClick?: () => void;
}

export function StepStations({
  stations,
  onAddStation,
  onRemoveStation,
  maxStations,
  onUpgradeClick,
}: StepStationsProps) {
  const { isDark } = useDarkModeContext();
  const [newStation, setNewStation] = useState("");

  const isAtLimit = maxStations !== undefined && stations.length >= maxStations;

  const handleAdd = () => {
    if (newStation.trim() && !stations.includes(newStation.trim())) {
      onAddStation(newStation.trim());
      setNewStation("");
    }
  };

  return (
    <div>
      <h2
        className={`text-2xl font-bold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Add your stations
      </h2>
      <p className={`mb-6 cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Where does the work get done?
      </p>

      {/* Current Stations */}
      {stations.length > 0 && (
        <div className="mb-6 space-y-2">
          {stations.map((station, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                isDark ? "bg-slate-800 border-slate-700" : "bg-stone-50 border-stone-200"
              }`}
            >
              <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {station}
              </span>
              <button
                onClick={() => onRemoveStation(index)}
                className="text-red-500 hover:text-red-600 font-semibold transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Station Input */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <FormInput
            label=""
            value={newStation}
            onChange={(e) => setNewStation(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            placeholder="Add station..."
            disabled={isAtLimit}
            required={false}
          />
        </div>
        <Button variant="secondary" onClick={handleAdd} disabled={isAtLimit}>
          + Add
        </Button>
      </div>

      {/* Station Limit Warning */}
      {isAtLimit && (
        <>
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex-1 h-px ${isDark ? "bg-slate-600" : "bg-stone-300"}`} />
          </div>

          {/* Locked Stations Preview */}
          <div className="mb-6 space-y-2 opacity-60">
            {DEFAULT_STATIONS.filter((s) => !stations.includes(s)).map((station) => (
              <div
                key={station}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-gray-400"
                    : "bg-stone-100 border-stone-200 text-gray-600"
                }`}
              >
                <span className="font-medium">{station}</span>
                <span className="text-xl">🔒</span>
              </div>
            ))}
          </div>

          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="text-orange-500 hover:text-orange-600 font-semibold text-sm cursor-pointer"
            >
              Need more stations? Pro has unlimited →
            </button>
          )}
        </>
      )}
    </div>
  );
}

export { DEFAULT_STATIONS };
