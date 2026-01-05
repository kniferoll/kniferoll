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
  const { removeMember, updateMemberRole, updateMemberInvitePermission } =
    useMemberActions();
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

  const handleInvitePermissionChange = async (
    memberId: string,
    canInvite: boolean
  ) => {
    setUpdatingId(memberId);
    setError("");
    setSuccess("");

    try {
      await updateMemberInvitePermission(memberId, canInvite);
      setSuccess(canInvite ? "Can now invite" : "Invite permission revoked");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update permission"
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      {error && (
        <div className="pt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {success && (
        <div className="pt-4">
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      <SettingsSection
        title={`Members (${members.length})`}
        description="Manage kitchen access"
      >
        <div className="space-y-1.5">
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
                className={`px-3 py-2.5 rounded-lg ${
                  isDark ? "bg-slate-800" : "bg-stone-50"
                }`}
              >
                {/* Mobile: Stack layout, Desktop: Row layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium truncate ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {displayName}
                      {isCurrentUser && (
                        <span
                          className={`ml-1.5 text-xs font-normal ${
                            isDark ? "text-gray-400" : "text-gray-500"
                          }`}
                        >
                          (You)
                        </span>
                      )}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <span className="capitalize">{member.role}</span>
                      {member.email && !member.is_anonymous && (
                        <span className="ml-1.5">• {member.email}</span>
                      )}
                      {member.is_anonymous && (
                        <span className="ml-1.5">• Guest</span>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  {member.role === "owner" ? (
                    <span
                      className={`self-start sm:self-center flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isDark
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-orange-100 text-orange-600"
                      }`}
                    >
                      Owner
                    </span>
                  ) : isOwner ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(
                            member.id,
                            e.target
                              .value as Database["public"]["Enums"]["member_role"]
                          )
                        }
                        disabled={updatingId === member.id}
                        className={`px-2 py-1 border rounded-md text-xs disabled:opacity-50 cursor-pointer ${
                          isDark
                            ? "bg-slate-700 border-slate-600 text-white"
                            : "bg-white border-stone-300 text-gray-900"
                        }`}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                      </select>

                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={member.can_invite || false}
                          onChange={(e) =>
                            handleInvitePermissionChange(
                              member.id,
                              e.target.checked
                            )
                          }
                          disabled={updatingId === member.id}
                          className="w-3.5 h-3.5 accent-orange-500"
                        />
                        <span
                          className={`text-xs whitespace-nowrap ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Invite
                        </span>
                      </label>

                      <button
                        onClick={() => handleRemove(member.id)}
                        disabled={updatingId === member.id}
                        className="text-red-500 hover:text-red-600 font-medium text-xs disabled:opacity-50 cursor-pointer whitespace-nowrap"
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
          <Button variant="primary" onClick={onInviteClick} className="text-sm">
            {canInvite ? "Generate Invite Link" : "Upgrade to Invite"}
          </Button>
        </SettingsSection>
      )}
    </>
  );
}
