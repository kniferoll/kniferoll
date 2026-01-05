import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { usePlanLimits } from "@/hooks";
import { supabase } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
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

  const maxStations = limits?.maxStationsPerKitchen || 1;
  const isAtLimit = stations.length >= maxStations;

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
      const maxOrder = Math.max(...stations.map((s) => s.display_order || 0), -1);
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

  const handleDelete = async (stationId: string) => {
    if (!confirm("Delete this station? Items in this station will be deleted.")) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: err } = await supabase.from("stations").delete().eq("id", stationId);

      if (err) throw err;
      await loadStations();
      setSuccess("Station deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete station");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SettingsSection
        title={`Current Stations (${stations.length}/${maxStations})`}
        description="Manage your kitchen's prep stations"
      >
        <div className="space-y-2">
          {stations.length === 0 ? (
            <p className={isDark ? "text-gray-400" : "text-gray-600"}>
              No stations yet. Add your first station below.
            </p>
          ) : (
            stations.map((station) => (
              <div
                key={station.id}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  isDark ? "bg-slate-800" : "bg-stone-50"
                }`}
              >
                <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {station.name}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(station.id)}
                    disabled={saving}
                    className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </SettingsSection>

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
    </div>
  );
}
