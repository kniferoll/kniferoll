import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrepStore } from "../stores/prepStore";
import { usePrepEntryStore } from "../stores/prepEntryStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { getDeviceToken } from "../lib/supabase";
import {
  DateCalendar,
  ShiftToggle,
  PrepItemEntryForm,
  PrepItemList,
  ProgressBar,
} from "../components";
import { toLocalDate } from "../lib/dateUtils";

export function StationView() {
  const { id: stationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { prepItems, loadPrepItems, toggleComplete, deletePrepItem } =
    usePrepStore();
  const {
    suggestions,
    allRankedSuggestions,
    quickUnits,
    addingItem,
    loadSuggestionsAndUnits,
    addItemWithUpdates,
    dismissSuggestionPersistent,
  } = usePrepEntryStore();
  const {
    stations,
    sessionUser,
    currentKitchen,
    selectedDate,
    setSelectedDate,
    loadKitchen,
    selectedShift,
    setSelectedShift,
  } = useKitchenStore();
  const { user } = useAuthStore();

  const station = stations.find((s) => s.id === stationId);

  // Load kitchen data on refresh if we have kitchen but no stations
  useEffect(() => {
    if (currentKitchen?.id && stations.length === 0) {
      loadKitchen(currentKitchen.id);
    }
  }, [currentKitchen?.id, stations.length, loadKitchen]);

  // Get day name for selected date
  const selectedDateObj = toLocalDate(selectedDate);
  const dayName = selectedDateObj
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Check if selected day is closed
  const isClosed = currentKitchen?.closed_days?.includes(dayName) || false;

  // Get available shifts for selected date
  const availableShifts: string[] = isClosed
    ? []
    : currentKitchen?.schedule
    ? (currentKitchen.schedule as any).default ||
      (currentKitchen.schedule as any)[dayName] || ["AM", "PM"]
    : ["AM", "PM"];

  // Subscribe to real-time updates
  useRealtimePrepItems(stationId);

  // Load suggestions and units when kitchen, station, shift, or date changes
  useEffect(() => {
    if (currentKitchen?.id && stationId && selectedShift) {
      loadSuggestionsAndUnits(
        currentKitchen.id,
        stationId,
        selectedDate,
        selectedShift
      );
    }
  }, [
    currentKitchen?.id,
    stationId,
    selectedDate,
    selectedShift,
    loadSuggestionsAndUnits,
  ]);

  // Set initial shift when kitchen loads, only if not set or invalid
  useEffect(() => {
    if (currentKitchen && availableShifts.length > 0) {
      // Only set shift if none selected or if current selection isn't available
      if (!selectedShift || !availableShifts.includes(selectedShift)) {
        setSelectedShift(availableShifts[0]);
      }
    }
  }, [currentKitchen, availableShifts, selectedShift, setSelectedShift]);

  useEffect(() => {
    if (!stationId || !selectedShift) return;
    loadPrepItems(stationId, selectedDate, selectedShift);
  }, [stationId, selectedDate, selectedShift, loadPrepItems]);

  const handleAddItem = async (
    description: string,
    unitId: string | null,
    quantity: number | null
  ) => {
    if (!stationId || !currentKitchen?.id || !description.trim()) return;

    const userId = sessionUser?.id || getDeviceToken();

    await addItemWithUpdates(
      currentKitchen.id,
      stationId,
      selectedDate,
      selectedShift,
      description,
      unitId,
      quantity,
      userId
    );
  };

  const handleToggle = async (itemId: string) => {
    await toggleComplete(itemId);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Delete this prep item?")) {
      await deletePrepItem(itemId);
    }
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    if (!stationId || !selectedShift) return;
    const userId = user?.id || sessionUser?.id || getDeviceToken();
    await dismissSuggestionPersistent(
      suggestionId,
      stationId,
      selectedDate,
      selectedShift,
      userId
    );
  };

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Station not found
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = prepItems.filter((item) => item.completed).length;
  const totalCount = prepItems.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              ← Back
            </button>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={currentKitchen?.closed_days || []}
            />
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Shift Toggle or Closed Notice */}
          <div className="flex items-center justify-center">
            <ShiftToggle
              shifts={availableShifts}
              currentShift={selectedShift}
              onShiftChange={setSelectedShift}
              disabled={isClosed}
            />
          </div>

          {/* Progress */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400 mb-1">
                <span>
                  {completedCount} of {totalCount} complete
                </span>
                <span>{Math.round((completedCount / totalCount) * 100)}%</span>
              </div>
              <ProgressBar completed={completedCount} total={totalCount} />
            </div>
          )}
        </div>
      </header>

      {/* Prep Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {isClosed ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            <p className="text-lg mb-2">Kitchen is closed on this day</p>
            <p className="text-sm">Select a different date to add prep items</p>
          </div>
        ) : (
          <PrepItemList
            items={prepItems}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Add Item Form - Sticky Bottom */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-lg dark:shadow-xl">
          <div className="max-w-3xl mx-auto">
            <PrepItemEntryForm
              allSuggestions={allRankedSuggestions}
              suggestions={suggestions}
              quickUnits={quickUnits}
              onAddItem={handleAddItem}
              onDismissSuggestion={handleDismissSuggestion}
              disabled={!selectedShift}
              isLoading={addingItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}
