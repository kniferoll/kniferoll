import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { usePlanLimits } from "@/hooks";
import { supabase } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
import { ConfirmDeleteStationModal } from "../modals/ConfirmDeleteStationModal";
import { ConfirmHideStationModal } from "../modals/ConfirmHideStationModal";
import type { Database } from "@kniferoll/types";

type Station = Database["public"]["Tables"]["stations"]["Row"];

interface StationsSettingsTabProps {
  kitchenId: string;
  isOwner: boolean;
  onUpgradeClick: () => void;
}

export function StationsSettingsTab({
  kitchenId,
  isOwner,
  onUpgradeClick,
}: StationsSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { limits } = usePlanLimits();
  const [stations, setStations] = useState<Station[]>([]);
  const [newStationName, setNewStationName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // Only count active (non-hidden) stations towards limit
  const activeStations = stations.filter((s) => !s.is_hidden);
  const maxStations = limits?.maxStationsPerKitchen || 1;
  const isAtLimit = activeStations.length >= maxStations;

  useEffect(() => {
    loadStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenId]);

  const loadStations = async () => {
    const { data, error: err } = await supabase
      .from("stations")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .order("display_order");

    if (!err && data) {
      setStations(data);
    }
  };

  const handleAdd = async () => {
    if (!newStationName.trim()) {
      setError("Station name is required");
      return;
    }

    if (isAtLimit) {
      onUpgradeClick();
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const maxOrder = Math.max(
        ...stations.map((s) => s.display_order || 0),
        -1
      );
      const { error: err } = await supabase.from("stations").insert({
        kitchen_id: kitchenId,
        name: newStationName.trim(),
        display_order: maxOrder + 1,
      });

      if (err) throw err;
      setNewStationName("");
      await loadStations();
      setSuccess("Station added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add station");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (station: Station) => {
    setSelectedStation(station);
    setDeleteModalOpen(true);
  };

  const handleHideClick = (station: Station) => {
    setSelectedStation(station);
    setHideModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedStation) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: err } = await supabase
        .from("stations")
        .delete()
        .eq("id", selectedStation.id);

      if (err) throw err;
      await loadStations();
      setSuccess("Station deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete station");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async () => {
    if (!selectedStation) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: err } = await supabase
        .from("stations")
        .update({ is_hidden: true })
        .eq("id", selectedStation.id);

      if (err) throw err;
      await loadStations();
      setSuccess("Station hidden");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hide station");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleUnhide = async (station: Station) => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: err } = await supabase
        .from("stations")
        .update({ is_hidden: false })
        .eq("id", station.id);

      if (err) throw err;
      await loadStations();
      setSuccess("Station restored");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to restore station"
      );
    } finally {
      setSaving(false);
    }
  };

  // Separate active and hidden stations
  const hiddenStations = stations.filter((s) => s.is_hidden);

  return (
    <>
      {error && (
        <div className="pt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="pt-6">
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      <SettingsSection
        title={`Current Stations`}
        description="Manage your kitchen's prep stations"
      >
        <div className="space-y-2">
          {activeStations.length === 0 ? (
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              No stations yet. Add your first station below.
            </p>
          ) : (
            activeStations.map((station) => (
              <div
                key={station.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark ? "bg-slate-800" : "bg-stone-50"
                }`}
              >
                <span
                  className={`font-medium ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {station.name}
                </span>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleHideClick(station)}
                      disabled={saving}
                      className={`font-semibold disabled:opacity-50 cursor-pointer ${
                        isDark
                          ? "text-slate-400 hover:text-slate-300"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Hide
                    </button>
                    <button
                      onClick={() => handleDeleteClick(station)}
                      disabled={saving}
                      className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </SettingsSection>

      {/* Hidden Stations Section */}
      {hiddenStations.length > 0 && (
        <SettingsSection
          title="Hidden Stations"
          description="These stations are hidden from active use but their data is preserved"
        >
          <div className="space-y-2">
            {hiddenStations.map((station) => (
              <div
                key={station.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark ? "bg-slate-800/50" : "bg-stone-100/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isDark ? "text-slate-400" : "text-gray-500"
                    }`}
                  >
                    {station.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark
                        ? "bg-slate-700 text-slate-400"
                        : "bg-stone-200 text-gray-500"
                    }`}
                  >
                    Hidden
                  </span>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnhide(station)}
                      disabled={saving}
                      className="text-orange-500 hover:text-orange-600 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Unhide
                    </button>
                    <button
                      onClick={() => handleDeleteClick(station)}
                      disabled={saving}
                      className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SettingsSection>
      )}

      {isOwner && (
        <SettingsSection title="Add Station">
          {isAtLimit ? (
            <Alert variant="warning" className="mb-4">
              You've reached the maximum number of stations for your plan.
            </Alert>
          ) : null}

          <div className="flex gap-4">
            <div className="flex-1">
              <FormInput
                value={newStationName}
                onChange={(e) => setNewStationName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="Station name"
                disabled={isAtLimit}
              />
            </div>
            {isAtLimit ? (
              <Button variant="primary" onClick={onUpgradeClick}>
                Upgrade to Pro
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleAdd}
                disabled={saving || !newStationName.trim()}
              >
                Add
              </Button>
            )}
          </div>
        </SettingsSection>
      )}

      {/* Delete Modal */}
      <ConfirmDeleteStationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedStation(null);
        }}
        onConfirm={handleDelete}
        onHide={handleHide}
        stationName={selectedStation?.name || ""}
      />

      {/* Hide Modal */}
      <ConfirmHideStationModal
        isOpen={hideModalOpen}
        onClose={() => {
          setHideModalOpen(false);
          setSelectedStation(null);
        }}
        onConfirm={handleHide}
        stationName={selectedStation?.name || ""}
      />
    </>
  );
}
