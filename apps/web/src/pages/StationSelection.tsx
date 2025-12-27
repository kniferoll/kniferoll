import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";
import { StationSelector } from "../components";

export function StationSelection() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const {
    currentKitchen,
    sessionUser,
    stations,
    loading,
    claimStation,
    loadKitchen,
  } = useKitchenStore();

  const normalizedCode = (code || "").toUpperCase();
  const joinedCode = currentKitchen?.join_code?.toUpperCase();

  // Guard: if not joined or mismatched code, send to the join flow for this code
  useEffect(() => {
    if (!normalizedCode) {
      navigate("/join", { replace: true });
      return;
    }
    if (!currentKitchen || !sessionUser || joinedCode !== normalizedCode) {
      navigate(`/join/${normalizedCode}`, { replace: true });
    }
  }, [normalizedCode, currentKitchen, sessionUser, joinedCode, navigate]);

  // Ensure stations are loaded when kitchen exists
  useEffect(() => {
    if (currentKitchen?.id && stations.length === 0) {
      loadKitchen(currentKitchen.id);
    }
  }, [currentKitchen?.id, stations.length, loadKitchen]);

  const handleStationSelect = async (stationId: string) => {
    const result = await claimStation(stationId);
    if (result.error) {
      // We can render ErrorAlert via React state, but minimal approach navigates nowhere
      // In this page we simply stay and let the selector be visible.
      return;
    }
    navigate(`/station/${stationId}`);
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Gradient background blobs */}
      <div className="absolute -top-44 -right-60 h-60 w-80 md:right-0 bg-linear-to-b from-[#fff1be] via-[#ee87cb] to-[#b060ff] rotate-[-10deg] rounded-full blur-3xl opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -bottom-32 -left-40 h-64 w-80 bg-linear-to-t from-[#b060ff] via-[#ee87cb] to-[#fff1be] rotate-10 rounded-full blur-3xl opacity-30 dark:opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            Select Your Station
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Claim a station to get started
          </p>
        </div>

        <StationSelector
          stations={stations}
          onSelect={handleStationSelect}
          loading={loading}
        />
      </div>
    </div>
  );
}
