import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrepStore } from "../stores/prepStore";
import { usePrepEntryStore } from "../stores/prepEntryStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { getDeviceToken } from "../lib/supabase";
import type { PrepStatus } from "@kniferoll/types";
import {
  DateCalendar,
  ShiftToggle,
  PrepItemEntryForm,
  PrepItemList,
  ProgressBar,
  SkeletonList,
  CookInviteButton,
} from "../components";
import { toLocalDate } from "../lib/dateUtils";

export function StationView() {
  const { id: stationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shouldSort, setShouldSort] = useState(true);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const { prepItems, loading, loadPrepItems, cycleStatus, deletePrepItem } =
    usePrepStore();
  const {
    suggestions,
    masterSuggestions,
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
    setShouldSort(true); // Reset sorting on date/shift change
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

  const handleCycleStatus = async (itemId: string) => {
    const userName = sessionUser?.name || user?.email || undefined;
    await cycleStatus(itemId, userName);
    setShouldSort(false); // Keep items in place after status change
  };

  const handleDelete = async (itemId: string) => {
    await deletePrepItem(itemId);
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
  // Calculate status counts for progress bar
  const completedCount = prepItems.filter(
    (item) => item.status === "complete"
  ).length;
  const partialCount = prepItems.filter(
    (item) => item.status === "partial"
  ).length;
  const pendingCount = prepItems.filter(
    (item) => item.status === "pending" || !item.status
  ).length;
  const totalCount = prepItems.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                navigate(
                  currentKitchen?.join_code
                    ? `/join/${currentKitchen.join_code}/stations`
                    : "/join"
                )
              }
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
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1" />
            <ShiftToggle
              shifts={availableShifts}
              currentShift={selectedShift}
              onShiftChange={setSelectedShift}
              disabled={isClosed}
            />
            <div className="flex-1 flex justify-end">
              {sessionUser && currentKitchen && (
                <CookInviteButton
                  kitchenId={currentKitchen.id}
                  cookSessionUserId={sessionUser.id}
                />
              )}
            </div>
          </div>

          {/* Progress and Overflow Menu */}
          {totalCount > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar
                  completed={completedCount}
                  partial={partialCount}
                  pending={pendingCount}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                  className="shrink-0 w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
                  aria-label="More options"
                >
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </button>
                {showOverflowMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowOverflowMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 py-1 z-20">
                      <button
                        onClick={() => {
                          setShouldSort(true);
                          setShowOverflowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M7 15l5 5 5-5M7 9l5-5 5 5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Sort Items
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Prep Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
        {isClosed ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            <p className="text-lg mb-2">Kitchen is closed on this day</p>
            <p className="text-sm">Select a different date to add prep items</p>
          </div>
        ) : loading ? (
          <SkeletonList count={5} />
        ) : (
          <PrepItemList
            items={prepItems.map((item) => ({
              ...item,
              status: item.status as PrepStatus | null,
            }))}
            onCycleStatus={handleCycleStatus}
            onDelete={handleDelete}
            shouldSort={shouldSort}
          />
        )}
      </div>

      {/* Add Item Form - Floating Bottom */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
          <div className="max-w-3xl mx-auto px-4 pb-4 pointer-events-auto">
            <PrepItemEntryForm
              allSuggestions={masterSuggestions}
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
