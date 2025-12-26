import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { DateCalendar } from "../components/DateCalendar";
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

  // Get available shifts for selected date
  const availableShifts: string[] = currentKitchen?.schedule
    ? (currentKitchen.schedule as any).default ||
      (currentKitchen.schedule as any)[dayName] || ["AM", "PM"]
    : ["AM", "PM"];

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
          <div className="inline-flex rounded-lg border border-gray-300 bg-white flex-wrap">
            {availableShifts.map((shift: string, index: number) => (
              <button
                key={shift}
                onClick={() => setCurrentShift(shift)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  index === 0 ? "rounded-l-lg" : ""
                } ${
                  index === availableShifts.length - 1 ? "rounded-r-lg" : ""
                } ${
                  currentShift === shift
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {shift}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowJoinCode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Share Join Code
          </button>
        </div>

        {/* Join Code Modal */}
        {showJoinCode && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowJoinCode(false)}
          >
            <div
              className="bg-white rounded-lg p-8 shadow-xl max-w-md w-full relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowJoinCode(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Team Join Code
                </h3>

                {/* QR Code */}
                {qrCodeUrl && (
                  <div className="bg-white p-6 rounded-lg inline-block mb-6">
                    <img
                      src={qrCodeUrl}
                      alt="Kitchen QR Code"
                      className="w-75 h-75"
                    />
                  </div>
                )}

                {/* Code */}
                <p className="text-sm text-gray-600 mb-2">
                  Or enter code manually:
                </p>
                <p className="text-4xl font-bold text-blue-600 tracking-widest mb-6">
                  {currentKitchen.join_code}
                </p>

                <p className="text-sm text-gray-500">
                  Scan QR code or visit kniferoll.io/join
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Station Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progress.map((station) => (
            <button
              key={station.stationId}
              onClick={() => navigate(`/station/${station.stationId}`)}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {station.stationName}
              </h3>

              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">
                  {station.completed}/{station.total}
                </span>
                <span className="text-sm text-gray-600">
                  {station.total > 0
                    ? `${Math.round(
                        (station.completed / station.total) * 100
                      )}%`
                    : "0%"}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width:
                      station.total > 0
                        ? `${(station.completed / station.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </button>
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
