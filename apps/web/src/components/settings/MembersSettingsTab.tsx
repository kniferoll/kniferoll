import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { useRealtimeMembers, useMemberActions } from "@/hooks";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { SettingsSection } from "../ui/SettingsSection";
import type { Database } from "@kniferoll/types";

interface MembersSettingsTabProps {
  kitchenId: string;
  userId?: string;
  isOwner: boolean;
  canInvite: boolean;
  onInviteClick: () => void;
}

export function MembersSettingsTab({
  kitchenId,
  userId,
  isOwner,
  canInvite,
  onInviteClick,
}: MembersSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { members } = useRealtimeMembers(kitchenId);
  const { removeMember, updateMemberRole, updateMemberInvitePermission } = useMemberActions();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the kitchen?")) return;

    setUpdatingId(memberId);
    setError("");
    setSuccess("");

    try {
      await removeMember(memberId);
      setSuccess("Member removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (
    memberId: string,
    role: Database["public"]["Enums"]["member_role"]
  ) => {
    setUpdatingId(memberId);
    setError("");
    setSuccess("");

    try {
      await updateMemberRole(memberId, role);
      setSuccess("Role updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleInvitePermissionChange = async (memberId: string, canInvite: boolean) => {
    setUpdatingId(memberId);
    setError("");
    setSuccess("");

    try {
      await updateMemberInvitePermission(memberId, canInvite);
      setSuccess(canInvite ? "Can now invite" : "Invite permission revoked");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permission");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <SettingsSection
        title={`Kitchen Members (${members.length})`}
        description="Manage who has access to this kitchen"
      >
        <div className="space-y-3">
          {members.map((member) => {
            // Get display name with fallbacks
            const displayName =
              member.display_name ||
              (member.email ? member.email.split("@")[0] : null) ||
              (member.is_anonymous ? "Anonymous User" : "User");
            const isCurrentUser = member.user_id === userId;

            return (
              <div
                key={member.id}
                className={`p-4 rounded-xl ${isDark ? "bg-slate-800" : "bg-stone-50"}`}
              >
                {/* Mobile: Stack layout, Desktop: Row layout */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium truncate ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      {displayName}
                      {isCurrentUser && (
                        <span
                          className={`ml-2 text-sm font-normal ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          (You)
                        </span>
                      )}
                    </p>
                    <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <span className="capitalize">{member.role}</span>
                      {member.email && !member.is_anonymous && (
                        <span className="ml-2">• {member.email}</span>
                      )}
                      {member.is_anonymous && <span className="ml-2">• Guest</span>}
                    </p>
                  </div>

                  {/* Actions */}
                  {member.role === "owner" ? (
                    <span
                      className={`self-start md:self-center flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${
                        isDark
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      Owner
                    </span>
                  ) : isOwner ? (
                    <div className="flex flex-wrap items-center gap-3 md:gap-4">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target.value as Database["public"]["Enums"]["member_role"]
                          )
                        }
                        disabled={updatingId === member.id}
                        className={`px-3 py-2 border rounded-lg text-sm disabled:opacity-50 cursor-pointer ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-stone-300 text-gray-900"
                        }`}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.can_invite || false}
                          onChange={(e) =>
                            handleInvitePermissionChange(member.id, e.target.checked)
                          }
                          disabled={updatingId === member.id}
                          className="w-4 h-4 accent-orange-500"
                        />
                        <span
                          className={`text-sm whitespace-nowrap ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Can invite
                        </span>
                      </label>

                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={updatingId === member.id}
                        className="text-red-500 hover:text-red-600 font-semibold text-sm disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {(isOwner || canInvite) && (
        <SettingsSection title="Invite Members">
          <Button variant="primary" onClick={onInviteClick}>
            {canInvite ? "Generate Invite Link" : "Upgrade to Invite"}
          </Button>
        </SettingsSection>
      )}
    </div>
  );
}
