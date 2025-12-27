import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import {
  Header,
  DateCalendar,
  ShiftToggle,
  StationCard,
  JoinCodeModal,
  Button,
  SkeletonStationCard,
  ShareModal,
} from "../components";
import { toLocalDate } from "../lib/dateUtils";

interface StationProgress {
  stationId: string;
  stationName: string;
  total: number;
  completed: number;
  partial: number;
  pending: number;
}

export function ChefDashboard() {
  const { user, signOut } = useAuthStore();
  const {
    currentKitchen,
    stations,
    loadKitchen,
    selectedDate,
    setSelectedDate,
    selectedShift,
    setSelectedShift,
  } = useKitchenStore();
  const [progress, setProgress] = useState<StationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const navigate = useNavigate();

  const selectedDateObj = toLocalDate(selectedDate);
  const dayName = selectedDateObj
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const availableShifts: string[] = currentKitchen?.schedule
    ? (currentKitchen.schedule as any).default ||
      (currentKitchen.schedule as any)[dayName] ||
      []
    : [];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load first kitchen for this user via user_kitchens
    const loadUserKitchen = async () => {
      const { data: userKitchen } = await supabase
        .from("user_kitchens")
        .select("kitchen_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (userKitchen) {
        await loadKitchen(userKitchen.kitchen_id);
      }
    };

    loadUserKitchen();
  }, [user, navigate, loadKitchen]);

  // Set initial shift when kitchen loads, only if not set or invalid
  useEffect(() => {
    if (currentKitchen && availableShifts.length > 0) {
      if (!selectedShift || !availableShifts.includes(selectedShift)) {
        setSelectedShift(availableShifts[0]);
      }
    }
  }, [currentKitchen, availableShifts, selectedShift, setSelectedShift]);

  useEffect(() => {
    if (!currentKitchen || stations.length === 0 || !selectedShift) return;

    const fetchProgress = async () => {
      setLoading(true);
      const progressData: StationProgress[] = [];

      for (const station of stations) {
        const { data: items } = await supabase
          .from("prep_items")
          .select("id, status")
          .eq("station_id", station.id)
          .eq("shift_date", selectedDate)
          .eq("shift_name", selectedShift);

        const total = items?.length || 0;
        const completed =
          items?.filter((i) => i.status === "complete").length || 0;
        const partial =
          items?.filter((i) => i.status === "partial").length || 0;
        const pending =
          items?.filter((i) => i.status === "pending" || !i.status).length || 0;

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
      setLoading(false);
    };

    fetchProgress();

    // Subscribe to changes
    const channel = supabase
      .channel("dashboard_updates")
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
  }, [currentKitchen, stations, selectedShift, selectedDate]);

  // Generate QR code when modal is shown
  useEffect(() => {
    if (showJoinCode && currentKitchen?.join_code) {
      const joinUrl = `https://kniferoll.io/join/${currentKitchen.join_code}`;
      QRCode.toDataURL(joinUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error("QR generation error:", err));
    }
  }, [showJoinCode, currentKitchen?.join_code]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!currentKitchen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Loading kitchen...
          </p>
          <button
            onClick={() => navigate("/kitchen/new")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Or create a new kitchen
          </button>
        </div>
      </div>
    );
  }

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <Header
        title={currentKitchen.name}
        rightContent={
          <>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={currentKitchen?.closed_days || []}
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
        {/* Shift Toggle and Share Button */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <ShiftToggle
            shifts={availableShifts}
            currentShift={selectedShift}
            onShiftChange={setSelectedShift}
          />

          <div className="flex gap-2">
            <Button onClick={() => setShowShareModal(true)}>
              Share Kitchen
            </Button>
            <Button onClick={() => setShowJoinCode(true)} variant="secondary">
              Share Join Code
            </Button>
          </div>
        </div>

        {/* Share Modal */}
        <ShareModal
          kitchenId={currentKitchen.id}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />

        {/* Join Code Modal */}
        {showJoinCode && (
          <JoinCodeModal
            joinCode={currentKitchen.join_code}
            qrCodeUrl={qrCodeUrl}
            onClose={() => setShowJoinCode(false)}
          />
        )}

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: stations.length || 3 }).map((_, i) => (
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
                onClick={() => navigate(`/station/${station.stationId}`)}
              />
            ))
          ) : stations.length === 0 ? (
            <div className="text-center py-12 col-span-full">
              <p className="text-gray-600 dark:text-slate-400">
                No stations yet
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
