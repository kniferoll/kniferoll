import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useStations } from "../hooks/useStations";
import { useRealtimeStations } from "../hooks/useRealtimeStations";
import { supabase } from "../lib/supabase";
import { Button } from "../components/Button";
import { Header } from "../components/Header";
import { DateCalendar } from "../components/DateCalendar";
import { ShiftToggle } from "../components/ShiftToggle";
import { StationCard } from "../components/StationCard";
import { SkeletonStationCard } from "../components/Skeleton";
import { InviteLinkModal } from "../components/InviteLinkModal";

interface StationProgress {
  stationId: string;
  stationName: string;
  total: number;
  completed: number;
  partial: number;
  pending: number;
}

const DEFAULT_SHIFTS = ["Breakfast", "Lunch", "Dinner"];

export function KitchenDashboard() {
  const { kitchenId } = useParams<{ kitchenId: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
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
  const [showMenu, setShowMenu] = useState(false);

  const availableShifts = DEFAULT_SHIFTS;

  // Load kitchen on mount
  useEffect(() => {
    if (kitchenId && !currentKitchen) {
      loadKitchen(kitchenId);
    }
  }, [kitchenId, currentKitchen, loadKitchen]);

  // Set initial shift
  useEffect(() => {
    if (!selectedShift && availableShifts.length > 0) {
      setSelectedShift(availableShifts[0]);
    }
  }, [selectedShift, setSelectedShift]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

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

    // Subscribe to real-time changes
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

  if (!user || !kitchenId) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!currentKitchen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading kitchen...</p>
      </div>
    );
  }

  const handleStationClick = (stationId: string) => {
    navigate(`/station/${stationId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <Header
        title={currentKitchen?.name || "Kitchen"}
        leftContent={
          <button
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white inline-flex items-center"
          >
            ←
          </button>
        }
        rightContent={
          <>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={[]}
            />
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="inline-flex items-center justify-center rounded-md text-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 p-2 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 8c1.1 0 2-1 2-2s-1-2-2-2-2 1-2 2 1 2 2 2zm0 2c-1.1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2zm0 6c-1.1 0-2 1-2 2s1 2 2 2 2-1 2-2-1-2-2-2z" />
                </svg>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 py-1 z-20">
                  <button
                    onClick={() => {
                      handleSignOut();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </>
        }
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Shift Toggle and Send Invite Button */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <ShiftToggle
            shifts={availableShifts}
            currentShift={selectedShift}
            onShiftChange={setSelectedShift}
          />

          <Button onClick={() => setShowInviteModal(true)}>Send Invite</Button>
        </div>

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stationsLoading || loading ? (
            Array.from({ length: Math.max(3, stations.length) }).map((_, i) => (
              <SkeletonStationCard key={i} />
            ))
          ) : progress.length > 0 ? (
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
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No stations yet
              </p>
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
    </div>
  );
}
