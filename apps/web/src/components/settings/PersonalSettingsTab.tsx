import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { supabase, validatePassword, validatePasswordMatch } from "@/lib";
import { useAuthStore } from "@/stores";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { PasswordRequirements } from "../ui/PasswordRequirements";
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
  const { refreshUser, updatePassword } = useAuthStore();
  const originalName = getUserDisplayName(user);
  const [displayName, setDisplayName] = useState(originalName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    // Validate current password is provided
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }

    // Validate new password meets requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || "Invalid password");
      return;
    }

    // Validate passwords match
    const matchValidation = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchValidation.isValid) {
      setPasswordError(matchValidation.error || "Passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError("Current password is incorrect");
        return;
      }

      // Update to new password
      const result = await updatePassword(newPassword);

      if (result.error) {
        setPasswordError(result.error);
        return;
      }

      // Clear form and show success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated successfully");
    } catch {
      setPasswordError("Failed to update password. Please try again.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div data-testid="personal-settings-panel" className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SettingsSection
        title="Profile"
        headerAction={
          <div className="flex items-center gap-2">
            <span
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Dark
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isDark ? "true" : "false"}
              aria-label="Toggle dark mode"
              onClick={toggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                isDark ? "bg-orange-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isDark ? "translate-x-4.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        }
      >
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

      <SettingsSection title="Security">
        <div className="space-y-4">
          <div
            className={`p-3 rounded-lg text-sm ${
              isDark
                ? "bg-amber-900/30 text-amber-200 border border-amber-700/50"
                : "bg-amber-50 text-amber-800 border border-amber-200"
            }`}
          >
            Changing your password will sign you out of all other devices.
          </div>

          {passwordError && <Alert variant="error">{passwordError}</Alert>}
          {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

          <FormInput
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password"
          />

          <div>
            <FormInput
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
            />
            <div className="mt-2">
              <PasswordRequirements password={newPassword} />
            </div>
          </div>

          <FormInput
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password"
          />

          <div className="pt-2">
            <Button
              variant="primary"
              onClick={handlePasswordChange}
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
