import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { usePrepItems } from "../hooks/usePrepItems";
import { useStations } from "../hooks/useStations";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { useRealtimeStations } from "../hooks/useRealtimeStations";
import { usePrepItemActions } from "../hooks/usePrepItemActions";
import { supabase } from "../lib/supabase";
import { getTodayLocalDate } from "../lib/dateUtils";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { PrepItemAutocomplete } from "../components/PrepItemAutocomplete";
import type { Database, PrepStatus } from "@kniferoll/types";

type Station = Database["public"]["Tables"]["stations"]["Row"];

const DEFAULT_SHIFTS = ["Breakfast", "Lunch", "Dinner"];

export function StationView() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentKitchen,
    selectedDate,
    selectedShift,
    setSelectedDate,
    setSelectedShift,
    loadKitchen,
  } = useKitchenStore();
  const [kitchenId, setKitchenId] = useState<string | undefined>(undefined);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const { stations, loading: stationsLoading } = useStations(kitchenId);
  const { prepItems, loading: itemsLoading } = usePrepItems(
    currentStation?.id,
    selectedDate
  );
  useRealtimeStations(kitchenId);
  useRealtimePrepItems(currentStation?.id, selectedDate);

  const {
    addPrepItem,
    updateItemStatus,
    deleteItem,
    error: itemActionError,
  } = usePrepItemActions();

  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [error, setError] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  // Fetch station and load kitchen on mount
  useEffect(() => {
    if (!stationId) return;

    const fetchStationAndKitchen = async () => {
      try {
        const { data: station, error: err } = await supabase
          .from("stations")
          .select("kitchen_id")
          .eq("id", stationId)
          .single();

        if (err || !station) {
          console.error("Failed to fetch station:", err);
          return;
        }

        setKitchenId(station.kitchen_id);
        if (!currentKitchen) {
          await loadKitchen(station.kitchen_id);
        }
      } catch (err) {
        console.error("Error loading station:", err);
      }
    };

    fetchStationAndKitchen();
  }, [stationId, currentKitchen, loadKitchen]);

  // Initialize station and shift
  useEffect(() => {
    if (stations.length > 0 && !currentStation) {
      const station = stations.find((s) => s.id === stationId);
      setCurrentStation(station || stations[0]);
    }
  }, [stations, currentStation, stationId]);

  useEffect(() => {
    if (!selectedShift && DEFAULT_SHIFTS.length > 0) {
      setSelectedShift(DEFAULT_SHIFTS[1]); // Default to Lunch
    }
  }, [selectedShift, setSelectedShift]);

  if (!user || !stationId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (stationsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading kitchen...</p>
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <ErrorAlert
          title="No Stations"
          message="This kitchen has no stations configured"
        />
      </div>
    );
  }

  // Calculate prep stats
  const completedCount = prepItems.filter(
    (item) => item.status === "complete"
  ).length;
  const workingCount = prepItems.filter(
    (item) => item.status === "in_progress"
  ).length;
  const todoCount = prepItems.filter(
    (item) => item.status === "pending"
  ).length;
  const totalCount = prepItems.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleAddPrepItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDescription.trim() || !currentStation) {
      setError("Description is required");
      return;
    }

    setAddingItem(true);
    setError("");

    try {
      const { error: addError } = await addPrepItem(
        currentStation.id,
        selectedDate,
        selectedShift,
        newItemDescription,
        newItemQuantity || undefined,
        newItemUnit || undefined,
        kitchenId
      );

      if (addError) {
        setError(addError);
      } else {
        // Clear form
        setNewItemDescription("");
        setNewItemQuantity("");
        setNewItemUnit("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      setError(message);
    } finally {
      setAddingItem(false);
    }
  };

  const handleStatusChange = async (
    itemId: string,
    currentStatus: PrepStatus | null
  ) => {
    try {
      const statusCycle: Record<PrepStatus, PrepStatus> = {
        pending: "in_progress",
        in_progress: "complete",
        complete: "pending",
      };
      const newStatus = statusCycle[currentStatus || "pending"];

      const { error: updateError } = await updateItemStatus(itemId, newStatus);
      if (updateError) {
        setError(updateError);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update status";
      setError(message);
    }
  };

  const handleDeletePrepItem = async (itemId: string) => {
    try {
      const { error: deleteError } = await deleteItem(itemId);
      if (deleteError) {
        setError(deleteError);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete item";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => kitchenId && navigate(`/kitchen/${kitchenId}`)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
              >
                ← Kitchen Overview
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStation?.name}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Date picker */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayLocalDate()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
              />

              {/* Menu button */}
              <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                ⋮
              </button>
            </div>
          </div>

          {/* Station and Shift selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Station:
              </label>
              <select
                value={currentStation?.id || ""}
                onChange={(e) => {
                  const station = stations.find((s) => s.id === e.target.value);
                  setCurrentStation(station || null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
              >
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift tabs */}
            <div className="flex gap-2">
              {DEFAULT_SHIFTS.map((shift) => (
                <button
                  key={shift}
                  onClick={() => setSelectedShift(shift)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedShift === shift
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {shift}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Progress
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Done</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {completedCount}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Working</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {workingCount}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Todo</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {todoCount}
              </p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {totalCount}
              </p>
            </div>
          </div>
        </div>

        {/* Prep items list */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
          {itemsLoading ? (
            <p className="text-gray-600 dark:text-gray-400">
              Loading prep items...
            </p>
          ) : prepItems.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              No prep items for this shift. Add one below to get started!
            </p>
          ) : (
            <ul className="space-y-2">
              {prepItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
                >
                  {/* Status indicator */}
                  <button
                    onClick={() =>
                      handleStatusChange(
                        item.id,
                        item.status as PrepStatus | null
                      )
                    }
                    className="shrink-0 w-6 h-6 rounded-full border-2 border-gray-400 hover:border-gray-600 transition-colors flex items-center justify-center"
                  >
                    {item.status === "complete" && (
                      <div className="w-4 h-4 bg-blue-600 rounded-full" />
                    )}
                    {item.status === "in_progress" && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full" />
                    )}
                  </button>

                  {/* Item details */}
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium">
                      {item.description}
                    </p>
                    {item.quantity && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.quantity} {item.unit_id || ""}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeletePrepItem(item.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-all"
                  >
                    🗑
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add prep item form */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 sticky bottom-0">
          {(error || itemActionError) && (
            <ErrorAlert
              title="Error"
              message={error || itemActionError || ""}
            />
          )}

          <form onSubmit={handleAddPrepItem} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <PrepItemAutocomplete
                kitchenId={kitchenId}
                stationId={currentStation?.id}
                shiftName={selectedShift}
                value={newItemDescription}
                onChange={setNewItemDescription}
                onSelectSuggestion={(suggestion) => {
                  setNewItemDescription(suggestion.description);
                  if (suggestion.last_quantity_used) {
                    setNewItemQuantity(
                      suggestion.last_quantity_used.toString()
                    );
                  }
                  if (suggestion.default_unit_id) {
                    setNewItemUnit(suggestion.default_unit_id);
                  }
                }}
                disabled={addingItem}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  placeholder="Amount"
                  disabled={addingItem}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  placeholder="e.g., lbs, cups"
                  disabled={addingItem}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={addingItem || !newItemDescription.trim()}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addingItem ? "Adding..." : "Add Prep Item"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
