import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { supabase } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
import type { User } from "@supabase/supabase-js";

// Simple helper to format account creation date
function formatMemberSince(dateStr: string | undefined): string {
  if (!dateStr) return "Unknown";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

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

      <SettingsSection title="Account Details">
        <div
          className={`p-4 rounded-xl space-y-3 ${
            isDark ? "bg-slate-800" : "bg-stone-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Member since
            </span>
            <span
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {formatMemberSince(user.created_at)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Account ID
            </span>
            <span
              className={`text-xs font-mono ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}
            >
              {user.id.slice(0, 8)}...{user.id.slice(-4)}
            </span>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
