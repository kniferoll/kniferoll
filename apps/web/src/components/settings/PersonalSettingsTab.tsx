import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { supabase } from "@/lib";
import { useAuthStore } from "@/stores";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
import type { User } from "@supabase/supabase-js";

interface PersonalSettingsTabProps {
  user: User;
}

// Get user's display name with fallbacks (same pattern as UserAvatarMenu)
function getUserDisplayName(user: User): string {
  const name = user.user_metadata?.name;
  if (name && typeof name === "string") return name;

  const displayName = user.user_metadata?.display_name;
  if (displayName && typeof displayName === "string") return displayName;

  return "";
}

export function PersonalSettingsTab({ user }: PersonalSettingsTabProps) {
  const { isDark, toggle } = useDarkModeContext();
  const { refreshUser } = useAuthStore();
  const originalName = getUserDisplayName(user);
  const [displayName, setDisplayName] = useState(originalName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasChanges = displayName !== originalName;

  useEffect(() => {
    setDisplayName(getUserDisplayName(user));
  }, [user]);

  const handleSave = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: displayName.trim() },
      });

      if (updateError) throw updateError;

      // Refresh the user in the auth store to update UI everywhere
      await refreshUser();

      setSuccess("Settings saved successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="personal-settings-panel" className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SettingsSection title="Profile">
        <div className="space-y-4">
          <FormInput
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
          />

          <FormInput
            label="Email"
            value={user.email || ""}
            onChange={() => {}}
            disabled
            helperText="Email cannot be changed"
          />

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Preferences">
        <div
          className={`flex items-center justify-between p-4 rounded-xl ${
            isDark ? "bg-slate-800" : "bg-stone-50"
          }`}
        >
          <div>
            <p
              className={`font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Dark Mode
            </p>
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Use dark theme throughout the app
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark ? "true" : "false"}
            onClick={toggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
              isDark ? "bg-orange-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isDark ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}
