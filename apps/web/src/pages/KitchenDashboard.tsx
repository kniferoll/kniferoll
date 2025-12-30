import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore, useKitchenStore } from "@/stores";
import { useStations, useRealtimeStations, useHeaderConfig } from "@/hooks";
import { useDarkModeContext } from "@/context";
import { supabase } from "@/lib";
import { jsDateToDatabaseDayOfWeek, toLocalDate } from "@/lib";
import {
  BackButton,
  Button,
  DateCalendar,
  EmptyState,
  InviteLinkModal,
  Logo,
  NavLinks,
  ShiftToggle,
  SkeletonCard,
  StationCard,
  SummaryStats,
  TeamIcon,
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
  const { stations, loading: stationsLoading } = useStations(kitchenId);
  const [progress, setProgress] = useState<StationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [kitchenShifts, setKitchenShifts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [shiftDays, setShiftDays] = useState<
    Map<number, { is_open: boolean; shift_ids: string[] }>
  >(new Map());

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
              onInvite={() => setShowInviteModal(true)}
            />
          }
        />
      ),
    },
    [currentKitchen?.name, isDark, navigate, kitchenId]
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

  // Subscribe to real-time station updates
  useRealtimeStations(kitchenId);

  // Fetch progress data for all stations
  useEffect(() => {
    if (!stations.length) {
      setProgress([]);
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        const progressData: StationProgress[] = [];

        for (const station of stations) {
          const { data: items, error } = await supabase
            .from("prep_items")
            .select("id, status")
            .eq("station_id", station.id)
            .eq("shift_date", selectedDate);

          if (error) {
            console.error("Error fetching items:", error);
            continue;
          }

          const total = items?.length || 0;
          const completed =
            items?.filter((i) => i.status === "complete").length || 0;
          const partial =
            items?.filter((i) => i.status === "in_progress").length || 0;
          const pending =
            items?.filter((i) => i.status === "pending" || !i.status).length ||
            0;

          progressData.push({
            stationId: station.id,
            stationName: station.name,
            total,
            completed,
            partial,
            pending,
          });
        }

        setProgress(progressData);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setLoading(false);
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
  }, [stations, selectedDate, kitchenId]);

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

  const isLoading = stationsLoading || loading;

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 w-full">
        {/* Controls Row - Stack on mobile, horizontal on desktop */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          {/* Shift Toggle */}
          <ShiftToggle
            shifts={availableShifts}
            currentShift={selectedShift}
            onShiftChange={setSelectedShift}
          />

          {/* Right side: Calendar + Invite (on same row on desktop) */}
          <div className="flex items-center gap-2">
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={closedDaysArray}
            />
            {/* Invite button - desktop only */}
            <div className="hidden md:block">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInviteModal(true)}
              >
                <span className="flex items-center gap-2">
                  <TeamIcon className="w-4 h-4" />
                  Invite Team
                </span>
              </Button>
            </div>
          </div>
        </div>

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
            // Station cards with progress
            progress.map((station) => (
              <StationCard
                key={station.stationId}
                name={station.stationName}
                completed={station.completed}
                partial={station.partial}
                pending={station.pending}
                onClick={() => handleStationClick(station.stationId)}
              />
            ))
          ) : stations.length === 0 ? (
            // Empty state - no stations
            <div className="col-span-full">
              <EmptyState
                title="No stations yet"
                description="Add stations in kitchen settings to start tracking prep"
                action={{
                  label: "Go to Settings",
                  onClick: () => navigate(`/kitchen/${kitchenId}/settings`),
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && currentKitchen && (
        <InviteLinkModal
          kitchenId={kitchenId || ""}
          kitchenName={currentKitchen.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </>
  );
}
