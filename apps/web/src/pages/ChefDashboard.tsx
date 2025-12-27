import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import {
  DateCalendar,
  ShiftToggle,
  StationCard,
  JoinCodeModal,
  Button,
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
  const [showJoinCode, setShowJoinCode] = useState(false);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Mobile layout */}
          <div className="flex flex-col md:hidden gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50 truncate flex-1">
                {currentKitchen.name}
              </h1>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 whitespace-nowrap"
              >
                Sign Out
              </button>
            </div>
            <div className="flex justify-center">
              <DateCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                closedDays={currentKitchen?.closed_days || []}
              />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden md:flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              {currentKitchen.name}
            </h1>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={currentKitchen?.closed_days || []}
            />
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Shift Toggle and Share Button */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <ShiftToggle
            shifts={availableShifts}
            currentShift={selectedShift}
            onShiftChange={setSelectedShift}
          />

          <Button onClick={() => setShowJoinCode(true)}>Share Join Code</Button>
        </div>

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
          {progress.map((station) => (
            <StationCard
              key={station.stationId}
              name={station.stationName}
              completed={station.completed}
              partial={station.partial}
              pending={station.pending}
              onClick={() => navigate(`/station/${station.stationId}`)}
            />
          ))}
        </div>

        {stations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-slate-400">No stations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
