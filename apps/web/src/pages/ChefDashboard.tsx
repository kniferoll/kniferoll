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
import { getTodayLocalDate, toLocalDate } from "../lib/dateUtils";

interface StationProgress {
  stationId: string;
  stationName: string;
  total: number;
  completed: number;
}

export function ChefDashboard() {
  const { user, signOut } = useAuthStore();
  const { currentKitchen, stations, loadKitchen } = useKitchenStore();
  const [progress, setProgress] = useState<StationProgress[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDate());
  const [currentShift, setCurrentShift] = useState("");
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

  // Set initial shift when kitchen loads or date changes
  useEffect(() => {
    if (currentKitchen && availableShifts.length > 0) {
      if (!currentShift || !availableShifts.includes(currentShift)) {
        setCurrentShift(availableShifts[0]);
      }
    }
  }, [currentKitchen, availableShifts, selectedDate]);

  useEffect(() => {
    if (!currentKitchen || stations.length === 0 || !currentShift) return;

    const fetchProgress = async () => {
      const progressData: StationProgress[] = [];

      for (const station of stations) {
        const { data: items } = await supabase
          .from("prep_items")
          .select("id, completed")
          .eq("station_id", station.id)
          .eq("shift_date", selectedDate)
          .eq("shift_name", currentShift);

        const total = items?.length || 0;
        const completed =
          items?.filter((i) => i.completed === true).length || 0;

        progressData.push({
          stationId: station.id,
          stationName: station.name,
          total,
          completed,
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
  }, [currentKitchen, stations, currentShift, selectedDate]);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading kitchen...</p>
          <button
            onClick={() => navigate("/kitchen/new")}
            className="text-blue-600 hover:underline"
          >
            Or create a new kitchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentKitchen.name}
          </h1>
          <DateCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            closedDays={currentKitchen?.closed_days || []}
          />
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Shift Toggle and Share Button */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <ShiftToggle
            shifts={availableShifts}
            currentShift={currentShift}
            onShiftChange={setCurrentShift}
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
              total={station.total}
              onClick={() => navigate(`/station/${station.stationId}`)}
            />
          ))}
        </div>

        {stations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No stations yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
