import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";

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
  const [currentShift, setCurrentShift] = useState("AM");
  const [showJoinCode, setShowJoinCode] = useState(false);
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Load first kitchen owned by this user
    const loadUserKitchen = async () => {
      const { data: kitchen } = await supabase
        .from("kitchens")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (kitchen) {
        await loadKitchen(kitchen.id);
      }
    };

    loadUserKitchen();
  }, [user, navigate, loadKitchen]);

  useEffect(() => {
    if (!currentKitchen || stations.length === 0) return;

    const fetchProgress = async () => {
      const progressData: StationProgress[] = [];

      for (const station of stations) {
        const { data: items } = await supabase
          .from("prep_items")
          .select("id, completed")
          .eq("station_id", station.id)
          .eq("shift_date", today)
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
  }, [currentKitchen, stations, currentShift, today]);

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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentKitchen.name}
            </h1>
            <p className="text-sm text-gray-600">
              {new Date(today).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Shift Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            <button
              onClick={() => setCurrentShift("AM")}
              className={`px-6 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                currentShift === "AM"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              AM Shift
            </button>
            <button
              onClick={() => setCurrentShift("PM")}
              className={`px-6 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                currentShift === "PM"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              PM Shift
            </button>
          </div>

          <button
            onClick={() => setShowJoinCode(!showJoinCode)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Share Join Code
          </button>
        </div>

        {/* Join Code Modal */}
        {showJoinCode && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-2">Kitchen Join Code</p>
              <p className="text-4xl font-bold text-blue-600 tracking-widest mb-4">
                {currentKitchen.join_code}
              </p>
              <p className="text-sm text-gray-600">
                Share this code with your team to let them join
              </p>
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
