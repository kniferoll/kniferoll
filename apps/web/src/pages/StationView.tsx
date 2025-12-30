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
  BackButton,
  EmptyState,
  UserAvatarMenu,
  Logo,
  NavLinks,
} from "@/components";
import { useDarkModeContext } from "@/context";

/**
 * StationView - the main prep list interface for a station
 *
 * Customizes the header to show date/shift controls.
 * Single-purpose: focused on prep list management for kitchen crews.
 */
export function StationView() {
  const { stationId } = useParams<{ stationId: string }>();
  const navigate = useNavigate();

  // Stores
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
  const { isDark } = useDarkModeContext();

  // Local state
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
          label="Back"
        />
      ),
      centerContent: (
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} />
          <span
            className={`text-lg font-semibold ${
              isDark ? "text-white" : "text-stone-900"
            }`}
          >
            {station?.name || "Station"}
          </span>
        </div>
      ),
      endContent: <NavLinks end={<UserAvatarMenu />} />,
    },
    [station?.name, isDark, navigate]
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
      <div className="flex items-center justify-center h-[50vh] px-4">
        <EmptyState
          title="Station not found"
          description="This station is no longer available"
          action={{
            label: "Back to Dashboard",
            onClick: () => navigate("/dashboard"),
          }}
        />
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
    <div className="flex flex-col h-full">
      {/* Controls Row - Shift Toggle, Calendar, Progress Bar */}
      {!isClosed && (
        <div className="px-4 py-4 bg-transparent">
          <div className="max-w-5xl mx-auto">
            {/* Mobile: Stacked */}
            <div className="md:hidden flex flex-col gap-4">
              <ShiftToggle
                shifts={availableShifts.map((s) => s.name)}
                currentShift={
                  availableShifts.find((s) => s.id === selectedShiftId)?.name ||
                  ""
                }
                onShiftChange={(shiftName) => {
                  const shift = availableShifts.find(
                    (s) => s.name === shiftName
                  );
                  if (shift) setSelectedShiftId(shift.id);
                }}
                disabled={isClosed}
              />
              <DateCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                closedDays={closedDaysArray}
              />
            </div>

            {/* Desktop: Horizontal with Progress Bar */}
            <div className="hidden md:flex md:items-center md:gap-4">
              <ShiftToggle
                shifts={availableShifts.map((s) => s.name)}
                currentShift={
                  availableShifts.find((s) => s.id === selectedShiftId)?.name ||
                  ""
                }
                onShiftChange={(shiftName) => {
                  const shift = availableShifts.find(
                    (s) => s.name === shiftName
                  );
                  if (shift) setSelectedShiftId(shift.id);
                }}
                disabled={isClosed}
              />
              <div className="flex-1 min-w-0">
                <ProgressBar
                  completed={completedCount}
                  partial={inProgressCount}
                  pending={pendingCount}
                />
              </div>
              <DateCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                closedDays={closedDaysArray}
              />
            </div>
          </div>
        </div>
      )}

      {/* Prep Items List - Main content area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
        <div className="max-w-5xl mx-auto">
          {isClosed ? (
            <EmptyState
              title="Kitchen closed"
              description="This kitchen is closed on the selected day. Choose a different date."
            />
          ) : loading ? (
            <EmptyState title="Loading prep items..." />
          ) : totalCount === 0 && !addingItem ? (
            <EmptyState
              title="No prep items yet"
              description="Add your first prep item below to get started"
            />
          ) : (
            <PrepItemList
              items={prepItems as any}
              onCycleStatus={handleCycleStatus}
              onDelete={handleDelete}
              shouldSort={true}
            />
          )}
        </div>
      </div>

      {/* Add Item Form - Floating Bottom */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-transparent pointer-events-none">
          <div className="px-4 py-4 pointer-events-auto flex justify-center">
            <div className="w-full max-w-2xl">
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
        </div>
      )}
    </div>
  );
}
