import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchen } from "../hooks/useKitchens";
import { usePlanLimits, usePaywall } from "../hooks/usePlanLimits";
import { useMemberActions } from "../hooks/useMemberActions";
import { useRealtimeMembers } from "../hooks/useRealtimeMembers";
import { useStripeCheckout } from "../hooks/useStripeCheckout";
import {
  useKitchenShifts,
  useKitchenShiftActions,
  DAYS_OF_WEEK,
} from "../hooks/useKitchenShifts";
import { useUserSubscription } from "../hooks/useUserSubscription";
import { redirectToCustomerPortal } from "../lib/stripe";
import { supabase } from "../lib/supabase";
import { CenteredPage } from "../components/CenteredPage";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import { InviteLinkModal } from "../components/InviteLinkModal";
import { UpgradeModal } from "../components/UpgradeModal";
import type { Database } from "@kniferoll/types";

type Station = Database["public"]["Tables"]["stations"]["Row"];

export function KitchenSettings() {
  const { kitchenId } = useParams<{ kitchenId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { kitchen, loading: kitchenLoading } = useKitchen(kitchenId);
  const { members: realtimeMembers } = useRealtimeMembers(kitchenId);
  const { limits } = usePlanLimits();
  const { showPaywall, showStationPaywall, closePaywall } = usePaywall();
  const { handleCheckout } = useStripeCheckout();
  const { removeMember, updateMemberRole, updateMemberInvitePermission } =
    useMemberActions();
  const {
    shifts,
    shiftDays,
    loading: shiftsLoading,
  } = useKitchenShifts(kitchenId);
  const { addShift, deleteShift, updateShiftDay } =
    useKitchenShiftActions(kitchenId);
  const { profile: userProfile } = useUserSubscription();
  const [activeTab, setActiveTab] = useState<
    "general" | "schedule" | "stations" | "members" | "billing"
  >("general");
  const [kitchenName, setKitchenName] = useState("");
  const [stations, setStations] = useState<Station[]>([]);
  const [newStationName, setNewStationName] = useState("");
  const [newShiftName, setNewShiftName] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (kitchen) {
      setKitchenName(kitchen.name);
    }
  }, [kitchen]);

  useEffect(() => {
    if (kitchenId) {
      loadStations();
    }
  }, [kitchenId]);

  const loadStations = async () => {
    if (!kitchenId) return;
    const { data, error: err } = await supabase
      .from("stations")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .order("display_order");
    if (!err && data) {
      setStations(data);
    }
  };

  const handleSaveKitchenName = async () => {
    if (!kitchen || !kitchenName.trim()) {
      setError("Kitchen name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const { error: err } = await supabase
        .from("kitchens")
        .update({ name: kitchenName })
        .eq("id", kitchen.id);

      if (err) throw err;
      setSuccessMessage("Kitchen name updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStation = async () => {
    if (!kitchenId || !newStationName.trim()) {
      setError("Station name is required");
      return;
    }

    // Check station limit
    if (
      !limits ||
      !limits.maxStationsPerKitchen ||
      stations.length >= limits.maxStationsPerKitchen
    ) {
      showStationPaywall();
      return;
    }

    setSaving(true);
    setError("");

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
      setSuccessMessage("Station added");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add station";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStation = async (stationId: string) => {
    if (
      !confirm("Delete this station? Items in this station will be deleted.")
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { error: err } = await supabase
        .from("stations")
        .delete()
        .eq("id", stationId);

      if (err) throw err;
      await loadStations();
      setSuccessMessage("Station deleted");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete station";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKitchen = async () => {
    if (
      !confirm(
        "Are you sure? This will permanently delete this kitchen and all prep data."
      )
    ) {
      return;
    }

    if (!confirm("This action cannot be undone. Type 'delete' to confirm.")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (!kitchen) {
        setError("Kitchen not loaded");
        setSaving(false);
        return;
      }

      const { error: err } = await supabase
        .from("kitchens")
        .delete()
        .eq("id", kitchen.id);

      if (err) throw err;
      navigate("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete kitchen";
      setError(message);
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Remove this member from the kitchen?")) {
      return;
    }

    setUpdatingMemberId(memberId);
    setError("");

    try {
      await removeMember(memberId);
      setSuccessMessage("Member removed");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove member";
      setError(message);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: Database["public"]["Enums"]["member_role"]
  ) => {
    setUpdatingMemberId(memberId);
    setError("");

    try {
      await updateMemberRole(memberId, newRole);
      setSuccessMessage("Member role updated");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update role";
      setError(message);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleUpdateMemberInvitePermission = async (
    memberId: string,
    canInvite: boolean
  ) => {
    setUpdatingMemberId(memberId);
    setError("");

    try {
      await updateMemberInvitePermission(memberId, canInvite);
      setSuccessMessage(
        canInvite ? "Member can now invite" : "Member invite permission revoked"
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update permission";
      setError(message);
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const isOwner = kitchen && user && kitchen.owner_id === user.id;
  const members = realtimeMembers; // Use realtime members

  if (kitchenLoading) {
    return (
      <CenteredPage>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </CenteredPage>
    );
  }

  if (!kitchen) {
    return (
      <CenteredPage>
        <ErrorAlert
          title="Kitchen Not Found"
          message="Could not load kitchen settings"
        />
      </CenteredPage>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {kitchen.name} Settings
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-800 flex">
            {(
              ["general", "schedule", "stations", "members", "billing"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {error && <ErrorAlert title="Error" message={error} />}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300">
                {successMessage}
              </div>
            )}

            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Kitchen Name
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={kitchenName}
                      onChange={(e) => setKitchenName(e.target.value)}
                      disabled={!isOwner}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50"
                    />
                    {isOwner && (
                      <Button
                        onClick={handleSaveKitchenName}
                        disabled={saving || kitchenName === kitchen.name}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold dark:text-white mb-4 text-red-600">
                      Danger Zone
                    </h3>
                    <Button
                      onClick={handleDeleteKitchen}
                      disabled={saving}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Kitchen
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Schedule Tab */}
            {activeTab === "schedule" && (
              <div className="space-y-6">
                {/* Shifts Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Kitchen Shifts
                  </h3>
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
                    <div className="space-y-2 mb-4">
                      {shiftsLoading ? (
                        <p className="text-gray-600 dark:text-gray-400">
                          Loading shifts...
                        </p>
                      ) : shifts.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400">
                          No custom shifts yet. Using default shifts (Breakfast,
                          Lunch, Dinner).
                        </p>
                      ) : (
                        shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded border border-gray-200 dark:border-gray-700"
                          >
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {shift.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {shift.start_time} - {shift.end_time}
                              </p>
                            </div>
                            {isOwner && (
                              <button
                                onClick={() => deleteShift(shift.id)}
                                className="text-red-600 hover:text-red-700 px-3 py-1"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {isOwner && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Add New Shift
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Shift name (e.g., Late Dinner)"
                            value={newShiftName}
                            onChange={(e) => setNewShiftName(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-900 dark:text-white"
                          />
                          <Button
                            onClick={async () => {
                              if (newShiftName.trim()) {
                                try {
                                  await addShift(newShiftName);
                                  setNewShiftName("");
                                  setSuccessMessage("Shift added");
                                } catch (err) {
                                  setError(
                                    err instanceof Error
                                      ? err.message
                                      : "Failed to add shift"
                                  );
                                }
                              }
                            }}
                            disabled={saving || !newShiftName.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Days Configuration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Operating Days
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DAYS_OF_WEEK.map((day, dayIndex) => {
                      const dayConfig = shiftDays.find(
                        (d) => d.day_of_week === dayIndex
                      );
                      const isOpen = dayConfig?.is_open ?? true;

                      return (
                        <label
                          key={dayIndex}
                          className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={(e) => {
                              updateShiftDay(dayIndex, e.target.checked);
                            }}
                            disabled={!isOwner}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {day}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Stations Tab */}
            {activeTab === "stations" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Stations ({stations.length}/
                    {limits?.maxStationsPerKitchen || 1})
                  </h3>
                  <div className="space-y-2">
                    {stations.map((station) => (
                      <div
                        key={station.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {station.name}
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteStation(station.id)}
                            disabled={saving}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-semibold disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isOwner && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    {stations.length < (limits?.maxStationsPerKitchen || 1) ? (
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          Add Station
                        </h3>
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={newStationName}
                            onChange={(e) => setNewStationName(e.target.value)}
                            placeholder="Station name"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
                          />
                          <Button
                            onClick={handleAddStation}
                            disabled={saving || !newStationName.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          Station Limit Reached
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          You've reached the maximum number of stations for your
                          plan. Upgrade to Pro to create more.
                        </p>
                        <Button
                          onClick={showStationPaywall}
                          variant="outline"
                          className="border-amber-300 dark:border-amber-700"
                        >
                          Upgrade to Pro
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Kitchen Members ({members.length})
                  </h3>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user_id
                              ? "Registered User"
                              : "Anonymous User"}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {member.role}
                          </p>
                        </div>

                        {isOwner && member.role !== "owner" && (
                          <div className="flex items-center gap-4">
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleUpdateMemberRole(
                                  member.id,
                                  e.target
                                    .value as Database["public"]["Enums"]["member_role"]
                                )
                              }
                              disabled={updatingMemberId === member.id}
                              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-700 dark:text-white text-sm disabled:opacity-50"
                            >
                              <option value="member">Member</option>
                              <option value="admin">Admin</option>
                              <option value="owner">Owner</option>
                            </select>

                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={member.can_invite || false}
                                onChange={(e) =>
                                  handleUpdateMemberInvitePermission(
                                    member.id,
                                    e.target.checked
                                  )
                                }
                                disabled={updatingMemberId === member.id}
                                className="disabled:opacity-50"
                              />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Can invite
                              </span>
                            </label>

                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={updatingMemberId === member.id}
                              className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-semibold text-sm disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {member.role === "owner" && (
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-semibold">
                              Owner
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(isOwner ||
                  members.find((m) => m.user_id === user?.id)?.can_invite) && (
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Generate Invite Link
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && isOwner && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Current Plan
                  </h3>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Plan Status
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                      {userProfile?.plan === "pro" ? "Pro" : "Free"}
                    </p>
                    {userProfile?.plan === "pro" &&
                      userProfile?.subscription_period_end && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Subscription renews on{" "}
                          {new Date(
                            userProfile.subscription_period_end
                          ).toLocaleDateString()}
                        </p>
                      )}
                  </div>

                  {userProfile?.plan === "free" ? (
                    <div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                          Pro Features:
                        </h4>
                        <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                          <li>✓ Unlimited kitchens</li>
                          <li>✓ Unlimited stations per kitchen</li>
                          <li>✓ Invite team members</li>
                          <li>✓ Real-time collaboration</li>
                        </ul>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            await handleCheckout();
                          } catch (error) {
                            console.error("Checkout failed:", error);
                            setError(
                              "Failed to start checkout. Please try again."
                            );
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Upgrade to Pro - $9/month
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✓ Your Pro subscription is active
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            await redirectToCustomerPortal({
                              userId: user!.id,
                              returnUrl: window.location.href,
                            });
                          } catch (error) {
                            console.error("Portal redirect failed:", error);
                            setError(
                              "Failed to open customer portal. Please try again."
                            );
                          }
                        }}
                        variant="outline"
                        className="w-full"
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Link Modal */}
      {showInviteModal && kitchen && (
        <InviteLinkModal
          kitchenId={kitchen.id}
          kitchenName={kitchen.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {/* Upgrade Modal */}
      {showPaywall && (
        <UpgradeModal
          title="Upgrade to Pro"
          description="Create unlimited stations and unlock more advanced features."
          features={[
            "Unlimited kitchens",
            "Unlimited stations per kitchen",
            "Invite team members",
            "Real-time collaboration",
          ]}
          onUpgrade={async () => {
            try {
              await handleCheckout();
            } catch (error) {
              console.error("Checkout failed:", error);
              // Modal will stay open so user can try again
            }
          }}
          onCancel={closePaywall}
        />
      )}
    </div>
  );
}
