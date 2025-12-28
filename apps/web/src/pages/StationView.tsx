import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrepStore } from "../stores/prepStore";
import { usePrepEntryStore } from "../stores/prepEntryStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { supabase, getDeviceToken } from "../lib/supabase";
import {
  jsDateToDatabaseDayOfWeek,
  toLocalDate,
} from "../lib/dateUtils";

import {
  DateCalendar,
  ShiftToggle,
  PrepItemEntryForm,
  PrepItemList,
  ProgressBar,
  SkeletonList,
  CookInviteButton,
} from "../components";

export function StationView() {
  const { stationId } = useParams<{ stationId: string }>();
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
    currentUser: sessionUser,
    currentKitchen,
    selectedDate,
    setSelectedDate,
    loadKitchen,
  } = useKitchenStore();
  const { user } = useAuthStore();

  const station = stations.find((s) => s.id === stationId);
  const [kitchenShifts, setKitchenShifts] = useState<Array<{id: string; name: string}>>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftDays, setShiftDays] = useState<Map<number, { is_open: boolean; shift_ids: string[] }>>(new Map());
  const [isClosed, setIsClosed] = useState(false);

  // Load kitchen data on refresh if we have kitchen but no stations
  useEffect(() => {
    if (currentKitchen?.id && stations.length === 0) {
      loadKitchen(currentKitchen.id);
    }
  }, [currentKitchen?.id, stations.length, loadKitchen]);

  // Load kitchen shifts and shift days when kitchen loads
  useEffect(() => {
    if (!currentKitchen?.id) return;

    const loadShiftsAndDays = async () => {
      // Load shifts
      const { data: shiftsData } = await supabase
        .from("kitchen_shifts")
        .select("id, name")
        .eq("kitchen_id", currentKitchen.id)
        .order("display_order");

      if (shiftsData) {
        setKitchenShifts(shiftsData);
        // Set initial shift ID to the first shift
        if (shiftsData.length > 0 && !selectedShiftId) {
          setSelectedShiftId(shiftsData[0].id);
        }
      }

      // Load shift days configuration
      const { data: shiftDaysData } = await supabase
        .from("kitchen_shift_days")
        .select("day_of_week, is_open, shift_ids")
        .eq("kitchen_id", currentKitchen.id);

      if (shiftDaysData) {
        const dayMap = new Map(
          shiftDaysData.map((day) => [
            day.day_of_week,
            { is_open: day.is_open, shift_ids: day.shift_ids || [] },
          ])
        );
        setShiftDays(dayMap);
      }
    };

    loadShiftsAndDays();
  }, [currentKitchen?.id, selectedShiftId]);

  // Check if selected day is closed and default to next open day if needed
  useEffect(() => {
    const selectedDateObj = toLocalDate(selectedDate);
    const jsDay = selectedDateObj.getDay();
    const dbDay = jsDateToDatabaseDayOfWeek(jsDay);
    const dayConfig = shiftDays.get(dbDay);
    
    if (dayConfig && !dayConfig.is_open) {
      setIsClosed(true);
      
      // Find the next open day
      let daysChecked = 0;
      let nextDate = new Date(selectedDateObj);
      
      while (daysChecked < 7) {
        nextDate.setDate(nextDate.getDate() + 1);
        const nextJsDay = nextDate.getDay();
        const nextDbDay = jsDateToDatabaseDayOfWeek(nextJsDay);
        const nextDayConfig = shiftDays.get(nextDbDay);
        
        if (nextDayConfig?.is_open) {
          const year = nextDate.getFullYear();
          const month = String(nextDate.getMonth() + 1).padStart(2, "0");
          const day = String(nextDate.getDate()).padStart(2, "0");
          const nextDateStr = `${year}-${month}-${day}`;
          setSelectedDate(nextDateStr);
          setIsClosed(false);
          break;
        }
        
        daysChecked++;
      }
    } else {
      setIsClosed(false);
    }
  }, [selectedDate, shiftDays, setSelectedDate]);

  // Subscribe to real-time updates
  useRealtimePrepItems(stationId, selectedDate);

  // Load suggestions and units when kitchen, station, shift, or date changes
  useEffect(() => {
    if (currentKitchen?.id && stationId && selectedShiftId) {
      loadSuggestionsAndUnits(
        currentKitchen.id,
        stationId,
        selectedDate,
        selectedShiftId
      );
    }
  }, [
    currentKitchen?.id,
    stationId,
    selectedDate,
    selectedShiftId,
    loadSuggestionsAndUnits,
  ]);

  useEffect(() => {
    if (!stationId || !selectedShiftId) return;
    loadPrepItems(stationId, selectedDate, selectedShiftId);
    setShouldSort(true); // Reset sorting on date/shift change
  }, [stationId, selectedDate, selectedShiftId, loadPrepItems]);

  // Get available shifts for the selected date (computed early so it's available for hooks)
  const selectedDateObj = toLocalDate(selectedDate);
  const selectedJsDay = selectedDateObj.getDay();
  const selectedDbDay = jsDateToDatabaseDayOfWeek(selectedJsDay);
  const selectedDayConfig = shiftDays.get(selectedDbDay);
  const availableShiftIds = selectedDayConfig?.shift_ids ?? [];
  const availableShifts = kitchenShifts.filter((s) =>
    availableShiftIds.includes(s.id)
  );

  // Auto-select first available shift if current shift is no longer available
  useEffect(() => {
    if (selectedShiftId && availableShifts.length > 0) {
      const isCurrentShiftAvailable = availableShifts.some(
        (s) => s.id === selectedShiftId
      );
      if (!isCurrentShiftAvailable) {
        setSelectedShiftId(availableShifts[0].id);
      }
    } else if (availableShifts.length > 0 && !selectedShiftId) {
      setSelectedShiftId(availableShifts[0].id);
    }
  }, [availableShifts, selectedShiftId, setSelectedShiftId]);

  const handleAddItem = async (
    description: string,
    unitId: string | null,
    quantity: number | null
  ) => {
    if (!stationId || !currentKitchen?.id || !selectedShiftId || !description.trim()) return;

    const userId = sessionUser?.id || getDeviceToken();

    return await addItemWithUpdates(
      currentKitchen.id,
      stationId,
      selectedDate,
      selectedShiftId,
      description,
      unitId,
      quantity,
      userId
    );
  };

  const handleCycleStatus = async (itemId: string) => {
    await cycleStatus(itemId);
    setShouldSort(false); // Keep items in place after status change
  };

  const handleDelete = async (itemId: string) => {
    await deletePrepItem(itemId);
  };

  const handleDismissSuggestion = async (suggestionId: string) => {
    if (!stationId || !selectedShiftId) return;
    const userId = user?.id || sessionUser?.id || getDeviceToken();
    await dismissSuggestionPersistent(
      suggestionId,
      stationId,
      selectedDate,
      selectedShiftId,
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

  // Get closed days for calendar (convert database day_of_week to day names for calendar)
  const dayNamesForCalendar = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const closedDaysArray = dayNamesForCalendar.filter((_dayName, jsDay) => {
    const dbDay = jsDateToDatabaseDayOfWeek(jsDay);
    const dayConfig = shiftDays.get(dbDay);
    return dayConfig && !dayConfig.is_open;
  });

  // Calculate status counts for progress bar
  const completedCount = prepItems.filter(
    (item) => item.status === "complete"
  ).length;
  const inProgressCount = prepItems.filter(
    (item) => item.status === "in_progress"
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
                  currentKitchen?.id
                    ? `/kitchen/${currentKitchen.id}/stations`
                    : "/dashboard"
                )
              }
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              ← Back
            </button>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={closedDaysArray}
            />
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Shift Toggle or Closed Notice */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1" />
            <ShiftToggle
              shifts={availableShifts.map(s => s.name)}
              currentShift={availableShifts.find(s => s.id === selectedShiftId)?.name || ""}
              onShiftChange={(shiftName) => {
                const shift = availableShifts.find(s => s.name === shiftName);
                if (shift) setSelectedShiftId(shift.id);
              }}
              disabled={isClosed}
            />
            <div className="flex-1 flex justify-end">
              {sessionUser && currentKitchen && <CookInviteButton />}
            </div>
          </div>

          {/* Progress and Overflow Menu */}
          {totalCount > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar
                  completed={completedCount}
                  partial={inProgressCount}
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
            items={prepItems as any}
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
              disabled={!selectedShiftId}
              isLoading={addingItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}
