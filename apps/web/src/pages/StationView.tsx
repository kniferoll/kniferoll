import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  useAuthStore,
  useKitchenStore,
  usePrepEntryStore,
  usePrepStore,
} from "@/stores";
import { useRealtimePrepItems, useHeaderConfig } from "@/hooks";
import { supabase, getDeviceToken } from "@/lib";
import { jsDateToDatabaseDayOfWeek, toLocalDate, isClosedDay, findNextOpenDay } from "@/lib";

import {
  DateCalendar,
  DismissibleAlert,
  ShiftToggle,
  PrepItemEntryForm,
  PrepItemList,
  PrepItemSkeleton,
  ProgressBar,
  BackButton,
  EmptyState,
  UserAvatarMenu,
  Logo,
  NavLinks,
  ControlsToggle,
  ToolsMenu,
  InviteLinkModal,
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
  const { prepItems, isInitialLoading, loadPrepItems, cycleStatus, deletePrepItem } =
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
    selectedShift: storedShiftName,
    setSelectedShift: setStoredShiftName,
    loadKitchen,
    loading: kitchenLoading,
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
  const [closedAlertDismissed, setClosedAlertDismissed] = useState(false);

  // UI state for controls
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [isCompact, setIsCompact] = useState(() => {
    const stored = localStorage.getItem("kniferoll:compactView");
    return stored === "true";
  });
  const [sortTrigger, setSortTrigger] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Persist compact view preference
  const handleToggleCompact = useCallback(() => {
    setIsCompact((prev) => {
      const newValue = !prev;
      localStorage.setItem("kniferoll:compactView", String(newValue));
      return newValue;
    });
  }, []);

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
      endContent: (
        <NavLinks
          end={
            <UserAvatarMenu
              kitchenId={currentKitchen?.id}
              onInvite={() => setShowInviteModal(true)}
            />
          }
        />
      ),
    },
    [station?.name, isDark, navigate, currentKitchen?.id]
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
          // Try to find the shift matching the stored shift name from kitchenStore
          const matchingShift = storedShiftName
            ? shiftsData.find((s) => s.name === storedShiftName)
            : null;
          // Use matching shift if found, otherwise use first shift
          setSelectedShiftId(matchingShift?.id || shiftsData[0].id);
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
  }, [currentKitchen?.id, selectedShiftId, storedShiftName]);

  // Check if selected date is closed
  const isSelectedDayClosed = shiftDays.size > 0 && isClosedDay(selectedDate, shiftDays);
  const nextOpenDay = isSelectedDayClosed ? findNextOpenDay(selectedDate, shiftDays) : null;

  // Reset closed alert dismissed state when date changes
  useEffect(() => {
    setClosedAlertDismissed(false);
  }, [selectedDate]);

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

  // Auto-select first available shift when current shift is not available for selected day
  useEffect(() => {
    if (selectedShiftId && availableShifts.length > 0) {
      const isCurrentShiftAvailable = availableShifts.some(
        (s) => s.id === selectedShiftId
      );
      if (!isCurrentShiftAvailable) {
        const fallbackShift = availableShifts[0];
        setSelectedShiftId(fallbackShift.id);
        setStoredShiftName(fallbackShift.name); // Sync to store
      }
    } else if (availableShifts.length > 0 && !selectedShiftId) {
      const fallbackShift = availableShifts[0];
      setSelectedShiftId(fallbackShift.id);
      setStoredShiftName(fallbackShift.name); // Sync to store
    }
  }, [availableShifts, selectedShiftId, setStoredShiftName]);

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

  // Handle shift change - updates local state and syncs to store
  const handleShiftChange = useCallback(
    (shiftName: string) => {
      const shift = availableShifts.find((s) => s.name === shiftName);
      if (shift) {
        setSelectedShiftId(shift.id);
        setStoredShiftName(shiftName); // Sync to kitchenStore for persistence
      }
    },
    [availableShifts, setStoredShiftName]
  );

  // Trigger a one-time sort of the prep list
  const handleSort = useCallback(() => {
    // Set to true to trigger the sort effect
    setSortTrigger(true);
    // Reset after a tick so it can be triggered again
    setTimeout(() => setSortTrigger(false), 100);
  }, []);

  // Determine if we're in initial loading state (kitchen data loading)
  const isPageLoading = kitchenLoading || (!station && stations.length === 0);

  // Show full-page skeleton while loading
  if (isPageLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Skeleton Controls Area */}
        <div className="px-4 pt-2 pb-1">
          <div className="max-w-5xl mx-auto">
            {/* Skeleton for controls toggle */}
            <div className="flex justify-center py-2">
              <div className={`h-6 w-24 rounded-full animate-pulse ${isDark ? "bg-slate-700" : "bg-stone-200"}`} />
            </div>
            {/* Skeleton for controls row */}
            <div className="pt-2 pb-3">
              <div className="flex items-center gap-4">
                {/* Shift toggle skeleton */}
                <div className={`h-10 w-48 rounded-full animate-pulse ${isDark ? "bg-slate-700" : "bg-stone-200"}`} />
                {/* Progress bar skeleton */}
                <div className={`flex-1 h-3 rounded-full animate-pulse ${isDark ? "bg-slate-700" : "bg-stone-200"}`} />
                {/* Calendar skeleton */}
                <div className={`h-10 w-32 rounded-xl animate-pulse ${isDark ? "bg-slate-700" : "bg-stone-200"}`} />
                {/* Tools skeleton */}
                <div className={`h-10 w-10 rounded-lg animate-pulse ${isDark ? "bg-slate-700" : "bg-stone-200"}`} />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Prep Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
          <div className="max-w-5xl mx-auto">
            <PrepItemSkeleton count={6} isCompact={isCompact} />
          </div>
        </div>

        {/* Skeleton Entry Form */}
        <div className="fixed bottom-0 left-0 right-0 bg-transparent pointer-events-none">
          <div className="px-4 py-4 pointer-events-auto flex justify-center">
            <div className="w-full max-w-2xl">
              <div className={`h-16 rounded-2xl animate-pulse ${isDark ? "bg-slate-800" : "bg-stone-100"}`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "Station not found" after loading completes and station still doesn't exist
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
      {/* Controls Area */}
      <div className="px-4 pt-2 pb-1 relative z-20">
        <div className="max-w-5xl mx-auto">
          {/* Toggle Button - centered pill (both mobile and desktop) */}
          <div>
            <ControlsToggle
              isCollapsed={controlsCollapsed}
              onToggle={() => setControlsCollapsed(!controlsCollapsed)}
            />
          </div>

          {/* Controls container with framer-motion height animation */}
          <motion.div
            initial={false}
            animate={{
              height: controlsCollapsed ? 0 : "auto",
              opacity: controlsCollapsed ? 0 : 1,
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ overflow: controlsCollapsed ? "hidden" : "visible" }}
          >
            <div className="pt-2 pb-3">
              {/* Desktop Layout: Single row - Shift | Progress | Calendar | Tools */}
              <div className="hidden md:block">
                <div className="flex items-center gap-4">
                  <ShiftToggle
                    shifts={availableShifts.map((s) => s.name)}
                    currentShift={
                      availableShifts.find((s) => s.id === selectedShiftId)
                        ?.name || ""
                    }
                    onShiftChange={handleShiftChange}
                    disabled={isSelectedDayClosed}
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
                  <ToolsMenu
                    onSort={handleSort}
                    isCompact={isCompact}
                    onToggleCompact={handleToggleCompact}
                  />
                </div>
              </div>

              {/* Mobile Layout: Stacked rows */}
              <div className="md:hidden">
                <div className="flex flex-col gap-3">
                  {/* Row 1: Calendar (left) + Tools (right) */}
                  <div className="flex items-center justify-between">
                    <DateCalendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      closedDays={closedDaysArray}
                    />
                    <ToolsMenu
                      onSort={handleSort}
                      isCompact={isCompact}
                      onToggleCompact={handleToggleCompact}
                    />
                  </div>

                  {/* Row 2: Shift Toggle */}
                  <div className="flex items-center justify-center">
                    <ShiftToggle
                      shifts={availableShifts.map((s) => s.name)}
                      currentShift={
                        availableShifts.find((s) => s.id === selectedShiftId)
                          ?.name || ""
                      }
                      onShiftChange={handleShiftChange}
                      disabled={isSelectedDayClosed}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Closed Day Alert */}
      {isSelectedDayClosed && !closedAlertDismissed && (
        <div className="px-4 pb-4">
          <div className="max-w-5xl mx-auto">
            <DismissibleAlert
              variant="warning"
              onDismiss={() => setClosedAlertDismissed(true)}
              action={
                nextOpenDay
                  ? {
                      label: "Go to next open day",
                      onClick: () => setSelectedDate(nextOpenDay),
                    }
                  : undefined
              }
            >
              <span className="font-medium">{currentKitchen?.name}</span> is
              closed on this day.
            </DismissibleAlert>
          </div>
        </div>
      )}

      {/* Prep Items List - Main content area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-48">
        <div className="max-w-5xl mx-auto">
          {isSelectedDayClosed ? (
            <EmptyState
              title="Kitchen closed"
              description="No prep items on closed days. Select a different date above."
            />
          ) : isInitialLoading ? (
            <PrepItemSkeleton count={5} isCompact={isCompact} />
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
              shouldSort={sortTrigger}
              isCompact={isCompact}
            />
          )}
        </div>
      </div>

      {/* Add Item Form - Floating Bottom */}
      {!isSelectedDayClosed && (
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

      {/* Invite Modal */}
      {showInviteModal && currentKitchen && (
        <InviteLinkModal
          kitchenId={currentKitchen.id}
          kitchenName={currentKitchen.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
