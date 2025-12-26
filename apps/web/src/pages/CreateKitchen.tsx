import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { FormInput, StationList, Button, ErrorAlert } from "../components";

const DEFAULT_STATIONS = ["Salads", "Grill", "Sauté", "Pantry", "Desserts"];

export function CreateKitchen() {
  const [kitchenName, setKitchenName] = useState("");
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [newStation, setNewStation] = useState("");
  const [error, setError] = useState("");
  const { createKitchen, loading } = useKitchenStore();
  const navigate = useNavigate();

  const handleAddStation = () => {
    if (newStation.trim() && !stations.includes(newStation.trim())) {
      setStations([...stations, newStation.trim()]);
      setNewStation("");
    }
  };

  const handleRemoveStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (stations.length === 0) {
      setError("Add at least one station");
      return;
    }

    const result = await createKitchen(kitchenName, stations);
    if (result.error) {
      setError(result.error);
    } else if (result.kitchenId) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            Create Your Kitchen
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Set up stations and get your team cooking
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-md dark:shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && <ErrorAlert message={error} />}

            <FormInput
              id="kitchenName"
              label="Kitchen Name"
              type="text"
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
            />

            <StationList
              stations={stations}
              onRemove={handleRemoveStation}
              newStation={newStation}
              onNewStationChange={setNewStation}
              onAddStation={handleAddStation}
            />

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creating..." : "Create Kitchen"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
