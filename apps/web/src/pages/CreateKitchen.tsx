import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";

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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Kitchen
          </h1>
          <p className="text-gray-600">
            Set up stations and get your team cooking
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="kitchenName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kitchen Name
              </label>
              <input
                id="kitchenName"
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Main Kitchen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stations
              </label>
              <div className="space-y-2 mb-3">
                {stations.map((station, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      {station}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStation(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  onChange={(e) => setNewStation(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddStation())
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add station..."
                />
                <button
                  type="button"
                  onClick={handleAddStation}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Kitchen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
