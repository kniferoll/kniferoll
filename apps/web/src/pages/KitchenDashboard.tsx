import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore, useKitchenStore } from "@/stores";
import {
  useStations,
  useCreateStation,
  useRealtimeStations,
  useHeaderConfig,
  usePlanLimits,
  useStripeCheckout,
} from "@/hooks";
import { useDarkModeContext } from "@/context";
import { supabase } from "@/lib";
import { jsDateToDatabaseDayOfWeek, toLocalDate, isClosedDay, findNextOpenDay } from "@/lib";
import {
  AddCard,
  AddStationModal,
  BackButton,
  Button,
  DateCalendar,
  DismissibleAlert,
  EmptyState,
  InviteLinkModal,
  Logo,
  NavLinks,
  ShiftToggle,
  SkeletonCard,
  StationCard,
  SummaryStats,
  TeamIcon,
  UpgradeModal,
  UserAvatarMenu,
} from "@/components";

interface StationProgress {
  stationId: string;
  stationName: string;
  total: number;
  completed: number;
  partial: number;
  pending: number;
}

export function KitchenDashboard() {
  const { kitchenId } = useParams<{ kitchenId: string }>();

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const {
    currentKitchen,
    loadKitchen,
    selectedDate,
    setSelectedDate,
    selectedShift,
    setSelectedShift,
  } = useKitchenStore();
  const { stations, isInitialLoading: stationsLoading, refetch: refetchStations } = useStations(kitchenId);
  const { createStation, loading: createStationLoading } = useCreateStation();
  const { limits, canCreateStation } = usePlanLimits();
  const { handleCheckout } = useStripeCheckout();
  const [progress, setProgress] = useState<StationProgress[]>([]);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  // Track if this is a date/shift change (vs initial load) - don't show loading for date changes
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showInviteUpgradeModal, setShowInviteUpgradeModal] = useState(false);
  const [canAddStation, setCanAddStation] = useState<boolean | null>(null);
  const [kitchenShifts, setKitchenShifts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [shiftDays, setShiftDays] = useState<
    Map<number, { is_open: boolean; shift_ids: string[] }>
  >(new Map());
  const [closedAlertDismissed, setClosedAlertDismissed] = useState(false);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    return progress.reduce(
      (acc, station) => ({
        completed: acc.completed + station.completed,
        inProgress: acc.inProgress + station.partial,
        pending: acc.pending + station.pending,
      }),
      { completed: 0, inProgress: 0, pending: 0 }
    );
  }, [progress]);

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

  const handleInviteClick = useCallback(() => {
    if (limits?.canInviteAsOwner) {
      setShowInviteModal(true);
    } else {
      setShowInviteUpgradeModal(true);
    }
  }, [limits?.canInviteAsOwner]);

  // Configure header: Back | Logo + Kitchen Name | Avatar Menu
  useHeaderConfig(
    {
      startContent: (
        <BackButton onClick={() => navigate("/dashboard")} label="Back" />
      ),
      centerContent: (
        <div className="flex items-center gap-2">
          <Logo size="sm" showText={false} />
          <span
            className={`text-lg font-semibold ${
              isDark ? "text-white" : "text-stone-900"
            }`}
          >
            {currentKitchen?.name || "Kitchen"}
          </span>
        </div>
      ),
      endContent: (
        <NavLinks
          end={
            <UserAvatarMenu
              kitchenId={kitchenId}
              onInvite={handleInviteClick}
            />
          }
        />
      ),
    },
    [currentKitchen?.name, isDark, navigate, kitchenId, handleInviteClick]
  );

  // Load kitchen on mount or when kitchenId changes
  useEffect(() => {
    if (!kitchenId) return;

    if (currentKitchen && currentKitchen.id !== kitchenId) {
      useKitchenStore.getState().clearKitchen();
    }

    if (currentKitchen?.id !== kitchenId) {
      loadKitchen(kitchenId);
    }
  }, [kitchenId, currentKitchen?.id, loadKitchen, currentKitchen]);

  // Load kitchen shifts and shift days
  useEffect(() => {
    if (!kitchenId) return;

    const loadShiftsAndDays = async () => {
      const { data: shiftsData } = await supabase
        .from("kitchen_shifts")
        .select("id, name")
        .eq("kitchen_id", kitchenId)
        .order("display_order");

      if (shiftsData) {
        setKitchenShifts(shiftsData);
      }

      const { data: shiftDaysData } = await supabase
        .from("kitchen_shift_days")
        .select("day_of_week, is_open, shift_ids")
        .eq("kitchen_id", kitchenId);

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
  }, [kitchenId]);

  // Get available shifts for the selected date
  const selectedDateObj = toLocalDate(selectedDate);
  const selectedJsDay = selectedDateObj.getDay();
  const selectedDbDay = jsDateToDatabaseDayOfWeek(selectedJsDay);
  const selectedDayConfig = shiftDays.get(selectedDbDay);
  const availableShiftIds = selectedDayConfig?.shift_ids ?? [];
  const availableShifts = kitchenShifts
    .filter((s) => availableShiftIds.includes(s.id))
    .map((s) => s.name);

  // Auto-select first available shift if current shift is no longer available
  useEffect(() => {
    if (availableShifts.length > 0) {
      const isCurrentShiftAvailable = availableShifts.includes(selectedShift);
      if (!isCurrentShiftAvailable) {
         
        setSelectedShift(availableShifts[0]);
      }
    }
  }, [selectedShift, setSelectedShift, availableShifts]);

  // Check if selected date is closed
  const isSelectedDayClosed = shiftDays.size > 0 && isClosedDay(selectedDate, shiftDays);
  const nextOpenDay = isSelectedDayClosed ? findNextOpenDay(selectedDate, shiftDays) : null;

  // Reset closed alert dismissed state when date changes
  useEffect(() => {
     
    setClosedAlertDismissed(false);
  }, [selectedDate]);

  // Subscribe to real-time station updates
  useRealtimeStations(kitchenId);

  // Check if user can create stations in this kitchen
  useEffect(() => {
    if (!kitchenId) {
       
      setCanAddStation(null);
      return;
    }

    const checkCanAdd = async () => {
      const result = await canCreateStation(kitchenId);
       
      setCanAddStation(result);
    };

    checkCanAdd();
  }, [kitchenId, canCreateStation, stations.length]);

  // Fetch progress data for all stations
  useEffect(() => {
    if (!stations.length) {
       
      setProgress([]);
       
      setIsProgressLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        // Only show loading on initial load, not on date/shift changes
        if (!hasLoadedOnce) {
          setIsProgressLoading(true);
        }

        // Fetch all prep items for all stations in parallel for speed
        const stationIds = stations.map((s) => s.id);
        const { data: items, error } = await supabase
          .from("prep_items")
          .select("id, status, station_id")
          .in("station_id", stationIds)
          .eq("shift_date", selectedDate);

        if (error) {
          console.error("Error fetching items:", error);
          return;
        }

        // Group items by station and compute progress
        const progressData: StationProgress[] = stations.map((station) => {
          const stationItems = (items || []).filter(
            (item) => item.station_id === station.id
          );
          const total = stationItems.length;
          const completed = stationItems.filter(
            (i) => i.status === "complete"
          ).length;
          const partial = stationItems.filter(
            (i) => i.status === "in_progress"
          ).length;
          const pending = stationItems.filter(
            (i) => i.status === "pending" || !i.status
          ).length;

          return {
            stationId: station.id,
            stationName: station.name,
            total,
            completed,
            partial,
            pending,
          };
        });

        setProgress(progressData);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setIsProgressLoading(false);
      }
    };

    fetchProgress();

    const channel = supabase
      .channel(`dashboard_${kitchenId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "prep_items",
        },
        () => {
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stations, selectedDate, kitchenId, hasLoadedOnce]);

  // Loading states
  if (!user || !kitchenId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-slate-400" : "text-stone-600"}>
          Loading...
        </p>
      </div>
    );
  }

  if (!currentKitchen || currentKitchen.id !== kitchenId) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-slate-400" : "text-stone-600"}>
          Loading kitchen...
        </p>
      </div>
    );
  }

  const handleStationClick = (stationId: string) => {
    navigate(`/station/${stationId}`);
  };

  const handleAddStationClick = () => {
    if (canAddStation) {
      setShowAddStationModal(true);
    } else {
      setShowUpgradeModal(true);
    }
  };

  const handleCreateStation = async (name: string) => {
    if (!kitchenId) return;
    const station = await createStation(kitchenId, name);
    if (station) {
      // Refresh stations list and canAddStation check after creating
      refetchStations();
      const result = await canCreateStation(kitchenId);
      setCanAddStation(result);
    }
  };

  // Only show skeleton loading state on initial load, not on date/shift changes
  const isLoading = stationsLoading || (isProgressLoading && !hasLoadedOnce);

  return (
    <div data-testid="page-kitchen-dashboard">
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Controls - Desktop Layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4 mb-8">
          <ShiftToggle
            shifts={availableShifts}
            currentShift={selectedShift}
            onShiftChange={setSelectedShift}
          />
          <div className="flex items-center gap-2">
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={closedDaysArray}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleInviteClick}
            >
              <span className="flex items-center gap-2">
                <TeamIcon className="w-4 h-4" />
                Invite Team
              </span>
            </Button>
          </div>
        </div>

        {/* Controls - Mobile Layout */}
        <div className="md:hidden flex flex-col gap-3 mb-6">
          {/* Row 1: Calendar (left aligned) */}
          <div className="flex items-center">
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={closedDaysArray}
            />
          </div>
          {/* Row 2: Shift Toggle (centered) */}
          <div className="flex items-center justify-center">
            <ShiftToggle
              shifts={availableShifts}
              currentShift={selectedShift}
              onShiftChange={setSelectedShift}
            />
          </div>
        </div>

        {/* Closed Day Alert */}
        {isSelectedDayClosed && !closedAlertDismissed && (
          <div className="mb-6">
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
        )}

        {/* Summary Stats - Desktop only */}
        {!isLoading && progress.length > 0 && (
          <div className="hidden md:block mb-8">
            <SummaryStats
              completed={summaryStats.completed}
              inProgress={summaryStats.inProgress}
              pending={summaryStats.pending}
            />
          </div>
        )}

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            // Skeleton loading state
            Array.from({ length: Math.max(3, stations.length) }).map((_, i) => (
              <SkeletonCard key={i} height="lg" />
            ))
          ) : progress.length > 0 ? (
            // Station cards with progress + add card
            <>
              {progress.map((station) => (
                <StationCard
                  key={station.stationId}
                  name={station.stationName}
                  completed={station.completed}
                  partial={station.partial}
                  pending={station.pending}
                  onClick={() => handleStationClick(station.stationId)}
                />
              ))}
              <AddCard
                label={canAddStation ? "Add Station" : "Add More Stations"}
                onClick={handleAddStationClick}
                disabled={!canAddStation}
                disabledLabel="Pro Feature"
              />
            </>
          ) : stations.length === 0 ? (
            // Empty state - no stations
            <div className="col-span-full">
              <EmptyState
                title="No stations yet"
                description="Add your first station to start tracking prep"
                action={{
                  label: canAddStation ? "Add Station" : "Upgrade to Pro",
                  onClick: handleAddStationClick,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteLinkModal
        isOpen={showInviteModal && !!currentKitchen}
        kitchenId={kitchenId || ""}
        kitchenName={currentKitchen?.name || ""}
        onClose={() => setShowInviteModal(false)}
      />

      {/* Add Station Modal */}
      <AddStationModal
        isOpen={showAddStationModal}
        onClose={() => setShowAddStationModal(false)}
        onSubmit={handleCreateStation}
        isLoading={createStationLoading}
      />

      {/* Upgrade Modal - Stations */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Add Unlimited Stations"
        description="Free accounts are limited to one station. Upgrade to Pro to add unlimited stations and organize your kitchen prep across multiple areas."
        features={[
          "Unlimited stations per kitchen",
          "Invite your team with shareable links",
          "Manage up to 5 kitchens",
          "Priority support",
        ]}
        onUpgrade={async () => {
          try {
            await handleCheckout();
          } catch (error) {
            console.error("Checkout failed:", error);
          }
        }}
      />

      {/* Upgrade Modal - Invites */}
      <UpgradeModal
        isOpen={showInviteUpgradeModal}
        onClose={() => setShowInviteUpgradeModal(false)}
        title="Invite Your Team"
        description="Collaboration is a Pro feature. Upgrade to share prep lists with your team and work together in real-time."
        features={[
          "Invite your team with shareable links",
          "Real-time collaboration on prep lists",
          "Unlimited stations per kitchen",
          "Manage up to 5 kitchens",
        ]}
        onUpgrade={async () => {
          try {
            await handleCheckout();
          } catch (error) {
            console.error("Checkout failed:", error);
          }
        }}
      />
    </div>
  );
}
