import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAuthStore,
  useKitchenStore,
  usePrepEntryStore,
  usePrepStore,
} from "@/stores";
import { useRealtimePrepItems, useHeaderConfig } from "@/hooks";
import { supabase, getDeviceToken } from "@/lib";
import { jsDateToDatabaseDayOfWeek, toLocalDate } from "@/lib";

import {
  DateCalendar,
  ShiftToggle,
  PrepItemEntryForm,
  PrepItemList,
  ProgressBar,
  CookInviteButton,
  BackButton,
} from "@/components";

/**
 * StationView - the main prep list interface for a station
 *
 * This page customizes the header to show:
 * - Back button (left)
 * - Date calendar (center)
 * - Shift toggle + overflow menu (right)
 *
 * Uses useHeaderConfig to inject content into the shared header.
 */
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
  const [kitchenShifts, setKitchenShifts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [shiftDays, setShiftDays] = useState<
    Map<number, { is_open: boolean; shift_ids: string[] }>
  >(new Map());
  const [isClosed, setIsClosed] = useState(false);

  // Get closed days for calendar
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

  // Get available shifts for the selected date
  const selectedDateObj = toLocalDate(selectedDate);
  const selectedJsDay = selectedDateObj.getDay();
  const selectedDbDay = jsDateToDatabaseDayOfWeek(selectedJsDay);
  const selectedDayConfig = shiftDays.get(selectedDbDay);
  const availableShiftIds = selectedDayConfig?.shift_ids ?? [];
  const availableShifts = kitchenShifts.filter((s) =>
    availableShiftIds.includes(s.id)
  );

  // Configure custom header for this page
  useHeaderConfig(
    {
      startContent: (
        <BackButton
          onClick={() =>
            navigate(
              currentKitchen?.id
                ? `/kitchen/${currentKitchen.id}`
                : "/dashboard"
            )
          }
        />
      ),
      centerContent: (
        <DateCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          closedDays={closedDaysArray}
        />
      ),
      endContent: (
        <div className="flex items-center gap-3">
          <ShiftToggle
            shifts={availableShifts.map((s) => s.name)}
            currentShift={
              availableShifts.find((s) => s.id === selectedShiftId)?.name || ""
            }
            onShiftChange={(shiftName) => {
              const shift = availableShifts.find((s) => s.name === shiftName);
              if (shift) setSelectedShiftId(shift.id);
            }}
            disabled={isClosed}
          />
          {sessionUser && currentKitchen && <CookInviteButton />}
        </div>
      ),
    },
    [
      selectedDate,
      selectedShiftId,
      availableShifts,
      isClosed,
      currentKitchen,
      sessionUser,
      closedDaysArray,
      navigate,
    ]
  );

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

  // Check if selected day is closed
  useEffect(() => {
    const dateObj = toLocalDate(selectedDate);
    const jsDay = dateObj.getDay();
    const dbDay = jsDateToDatabaseDayOfWeek(jsDay);
    const dayConfig = shiftDays.get(dbDay);

    if (dayConfig && !dayConfig.is_open) {
      setIsClosed(true);

      // Find the next open day
      let daysChecked = 0;
      let nextDate = new Date(dateObj);

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

  // Load suggestions and units
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

  // Load prep items
  useEffect(() => {
    if (!stationId || !selectedShiftId) return;
    loadPrepItems(stationId, selectedDate, selectedShiftId);
    setShouldSort(true);
  }, [stationId, selectedDate, selectedShiftId, loadPrepItems]);

  // Auto-select first available shift
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
  }, [availableShifts, selectedShiftId]);

  const handleAddItem = async (
    description: string,
    unitId: string | null,
    quantity: number | null
  ) => {
    if (
      !stationId ||
      !currentKitchen?.id ||
      !selectedShiftId ||
      !description.trim()
    )
      return;

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
    setShouldSort(false);
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
      <div className="flex items-center justify-center h-[50vh]">
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
  const inProgressCount = prepItems.filter(
    (item) => item.status === "in_progress"
  ).length;
  const pendingCount = prepItems.filter(
    (item) => item.status === "pending" || !item.status
  ).length;
  const totalCount = prepItems.length;

  return (
    <>
      {/* Progress Bar - below header */}
      {totalCount > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
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
        </div>
      )}

      {/* Prep Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
        <div className="max-w-3xl mx-auto">
          {isClosed ? (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              <p className="text-lg mb-2">Kitchen is closed on this day</p>
              <p className="text-sm">
                Select a different date to add prep items
              </p>
            </div>
          ) : loading ? (
            // <SkeletonList count={5} />
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              <p>Loading prep items...</p>
            </div>
          ) : (
            <PrepItemList
              items={prepItems as any}
              onCycleStatus={handleCycleStatus}
              onDelete={handleDelete}
              shouldSort={shouldSort}
            />
          )}
        </div>
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
    </>
  );
}
