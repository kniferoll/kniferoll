import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { supabase } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { DangerZone } from "../ui/DangerZone";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

interface GeneralSettingsTabProps {
  kitchen: Kitchen;
  isOwner: boolean;
  onDeleted: () => void;
}

export function GeneralSettingsTab({
  kitchen,
  isOwner,
  onDeleted,
}: GeneralSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const [kitchenName, setKitchenName] = useState(kitchen.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setKitchenName(kitchen.name);
  }, [kitchen.name]);

  const handleSave = async () => {
    if (!kitchenName.trim()) {
      setError("Kitchen name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: err } = await supabase
        .from("kitchens")
        .update({ name: kitchenName })
        .eq("id", kitchen.id);

      if (err) throw err;
      setSuccess("Kitchen name updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete this kitchen and all prep data."
      )
    ) {
      return;
    }

    if (!confirm("This action cannot be undone. Are you absolutely sure?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("kitchens")
        .delete()
        .eq("id", kitchen.id);

      if (err) throw err;
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete kitchen");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SettingsSection title="Kitchen Name">
        <div className="flex gap-4">
          <div className="flex-1">
            <FormInput
              value={kitchenName}
              onChange={(e) => setKitchenName(e.target.value)}
              disabled={!isOwner}
              placeholder="Kitchen name"
            />
          </div>
          {isOwner && (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || kitchenName === kitchen.name}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </SettingsSection>

      {isOwner && (
        <DangerZone>
          <p
            className={`text-sm mb-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Permanently delete this kitchen and all its data. This cannot be
            undone.
          </p>
          <Button
            variant="secondary"
            onClick={handleDelete}
            disabled={saving}
            className="border-red-500 text-red-500 hover:bg-red-500/10"
          >
            Delete Kitchen
          </Button>
        </DangerZone>
      )}
    </div>
  );
}
