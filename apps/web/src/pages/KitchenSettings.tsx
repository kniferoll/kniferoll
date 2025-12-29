import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useKitchen } from "@/hooks/useKitchens";
import { usePlanLimits, usePaywall } from "@/hooks/usePlanLimits";
import { useMemberActions } from "@/hooks/useMemberActions";
import { useRealtimeMembers } from "@/hooks/useRealtimeMembers";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import {
  useKitchenShifts,
  useKitchenShiftActions,
  DAYS_OF_WEEK,
} from "@/hooks/useKitchenShifts";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { useHeaderConfig } from "@/hooks/useHeader";
import { useDarkModeContext } from "@/context/DarkModeContext";
import { redirectToCustomerPortal } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import {
  BackButton,
  Button,
  Card,
  InviteLinkModal,
  UpgradeModal,
} from "@/components";
import type { Database } from "@kniferoll/types";

type Station = Database["public"]["Tables"]["stations"]["Row"];

export function KitchenSettings() {
  const { kitchenId } = useParams<{ kitchenId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
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

  // Configure header
  useHeaderConfig(
    {
      startContent: <BackButton onClick={() => navigate(-1)} label="Back" />,
      centerContent: (
        <span
          className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {kitchen?.name || "Kitchen"} Settings
        </span>
      ),
    },
    [kitchen?.name, isDark, navigate]
  );

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
  const members = realtimeMembers;

  // Loading state
  if (kitchenLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
      </div>
    );
  }

  // Error state
  if (!kitchen) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card padding="lg">
          <h2
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Kitchen Not Found
          </h2>
          <p className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Could not load kitchen settings
          </p>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card padding="none">
          {/* Tabs */}
          <div
            className={`border-b ${
              isDark ? "border-slate-700" : "border-stone-200"
            } flex overflow-x-auto`}
          >
            {(
              ["general", "schedule", "stations", "members", "billing"] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold capitalize border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab
                    ? "border-orange-500 text-orange-500"
                    : `border-transparent ${
                        isDark
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                      }`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Error message */}
            {error && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  isDark
                    ? "bg-red-950/50 text-red-400 border border-red-900/50"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {error}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  isDark
                    ? "bg-green-950/50 text-green-400 border border-green-900/50"
                    : "bg-green-50 text-green-600 border border-green-100"
                }`}
              >
                {successMessage}
              </div>
            )}

            {/* General Tab */}
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-2 ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Kitchen Name
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={kitchenName}
                      onChange={(e) => setKitchenName(e.target.value)}
                      disabled={!isOwner}
                      className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600 text-white"
                          : "bg-white border-stone-300 text-gray-900"
                      } disabled:opacity-50`}
                    />
                    {isOwner && (
                      <Button
                        variant="primary"
                        onClick={handleSaveKitchenName}
                        disabled={saving || kitchenName === kitchen.name}
                      >
                        Save
                      </Button>
                    )}
                  </div>
                </div>

                {isOwner && (
                  <div
                    className={`pt-6 border-t ${
                      isDark ? "border-slate-700" : "border-stone-200"
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-red-500 mb-4">
                      Danger Zone
                    </h3>
                    <Button
                      variant="secondary"
                      onClick={handleDeleteKitchen}
                      disabled={saving}
                      className="border-red-500 text-red-500 hover:bg-red-500/10"
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
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Kitchen Shifts
                  </h3>
                  <div
                    className={`rounded-lg p-4 mb-4 ${
                      isDark ? "bg-slate-800" : "bg-stone-50"
                    }`}
                  >
                    <div className="space-y-2 mb-4">
                      {shiftsLoading ? (
                        <p
                          className={isDark ? "text-gray-400" : "text-gray-600"}
                        >
                          Loading shifts...
                        </p>
                      ) : shifts.length === 0 ? (
                        <p
                          className={isDark ? "text-gray-400" : "text-gray-600"}
                        >
                          No custom shifts yet. Using default shifts (Breakfast,
                          Lunch, Dinner).
                        </p>
                      ) : (
                        shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              isDark
                                ? "bg-slate-900 border-slate-700"
                                : "bg-white border-stone-200"
                            }`}
                          >
                            <p
                              className={`font-semibold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {shift.name}
                            </p>
                            {isOwner && (
                              <button
                                onClick={() => deleteShift(shift.id)}
                                className="text-red-500 hover:text-red-600 px-3 py-1 cursor-pointer"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {isOwner && (
                      <div
                        className={`border-t pt-4 ${
                          isDark ? "border-slate-700" : "border-stone-200"
                        }`}
                      >
                        <label
                          className={`block text-sm font-semibold mb-2 ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Add New Shift
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Shift name (e.g., Late Dinner)"
                            value={newShiftName}
                            onChange={(e) => setNewShiftName(e.target.value)}
                            className={`flex-1 px-4 py-3 rounded-xl border ${
                              isDark
                                ? "bg-slate-900 border-slate-600 text-white"
                                : "bg-white border-stone-300 text-gray-900"
                            }`}
                          />
                          <Button
                            variant="primary"
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
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
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
                          className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                            isDark
                              ? "border-slate-600 hover:bg-slate-800"
                              : "border-stone-300 hover:bg-stone-50"
                          }`}
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
                          <span
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
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
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Current Stations ({stations.length}/
                    {limits?.maxStationsPerKitchen || 1})
                  </h3>
                  <div className="space-y-2">
                    {stations.map((station) => (
                      <div
                        key={station.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
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
                          <button
                            onClick={() => handleDeleteStation(station.id)}
                            disabled={saving}
                            className="text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {isOwner && (
                  <div
                    className={`pt-6 border-t ${
                      isDark ? "border-slate-700" : "border-stone-200"
                    }`}
                  >
                    {stations.length < (limits?.maxStationsPerKitchen || 1) ? (
                      <>
                        <h3
                          className={`text-lg font-semibold mb-4 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Add Station
                        </h3>
                        <div className="flex gap-4">
                          <input
                            type="text"
                            value={newStationName}
                            onChange={(e) => setNewStationName(e.target.value)}
                            placeholder="Station name"
                            className={`flex-1 px-4 py-3 rounded-xl border ${
                              isDark
                                ? "bg-slate-700/50 border-slate-600 text-white"
                                : "bg-white border-stone-300 text-gray-900"
                            }`}
                          />
                          <Button
                            variant="primary"
                            onClick={handleAddStation}
                            disabled={saving || !newStationName.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`rounded-lg p-4 ${
                          isDark
                            ? "bg-amber-950/30 border border-amber-900/50"
                            : "bg-amber-50 border border-amber-200"
                        }`}
                      >
                        <h3
                          className={`text-lg font-semibold mb-2 ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          Station Limit Reached
                        </h3>
                        <p
                          className={`mb-4 ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          You've reached the maximum number of stations for your
                          plan. Upgrade to Pro to create more.
                        </p>
                        <Button
                          variant="secondary"
                          onClick={showStationPaywall}
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
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Kitchen Members ({members.length})
                  </h3>
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isDark ? "bg-slate-800" : "bg-stone-50"
                        }`}
                      >
                        <div className="flex-1">
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {member.user_id
                              ? "Registered User"
                              : "Anonymous User"}
                          </p>
                          <p
                            className={`text-sm capitalize ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
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
                              className={`px-3 py-1 border rounded-lg text-sm disabled:opacity-50 ${
                                isDark
                                  ? "bg-slate-700 border-slate-600 text-white"
                                  : "bg-white border-stone-300 text-gray-900"
                              }`}
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
                              <span
                                className={`text-sm ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                Can invite
                              </span>
                            </label>

                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={updatingMemberId === member.id}
                              className="text-red-500 hover:text-red-600 font-semibold text-sm disabled:opacity-50 cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {member.role === "owner" && (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              isDark
                                ? "bg-orange-500/20 text-orange-400"
                                : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            Owner
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {(isOwner ||
                  members.find((m) => m.user_id === user?.id)?.can_invite) && (
                  <div
                    className={`pt-6 border-t ${
                      isDark ? "border-slate-700" : "border-stone-200"
                    }`}
                  >
                    <Button
                      variant="primary"
                      onClick={() => setShowInviteModal(true)}
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
                <div
                  className={`rounded-lg p-6 ${
                    isDark ? "bg-slate-800" : "bg-stone-50"
                  }`}
                >
                  <h3
                    className={`text-lg font-semibold mb-4 ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Current Plan
                  </h3>
                  <div className="mb-6">
                    <p
                      className={`text-sm mb-2 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Plan Status
                    </p>
                    <p
                      className={`text-2xl font-bold capitalize ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {userProfile?.plan === "pro" ? "Pro" : "Free"}
                    </p>
                    {userProfile?.plan === "pro" &&
                      userProfile?.subscription_period_end && (
                        <p
                          className={`text-sm mt-2 ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          Subscription renews on{" "}
                          {new Date(
                            userProfile.subscription_period_end
                          ).toLocaleDateString()}
                        </p>
                      )}
                  </div>

                  {userProfile?.plan === "free" ? (
                    <div>
                      <div
                        className={`rounded-lg p-4 mb-6 ${
                          isDark
                            ? "bg-orange-500/10 border border-orange-500/20"
                            : "bg-orange-50 border border-orange-100"
                        }`}
                      >
                        <h4
                          className={`font-semibold mb-3 ${
                            isDark ? "text-orange-400" : "text-orange-600"
                          }`}
                        >
                          Pro Features:
                        </h4>
                        <ul
                          className={`space-y-2 text-sm ${
                            isDark ? "text-orange-300" : "text-orange-700"
                          }`}
                        >
                          <li>✓ Unlimited kitchens</li>
                          <li>✓ Unlimited stations per kitchen</li>
                          <li>✓ Invite team members</li>
                          <li>✓ Real-time collaboration</li>
                        </ul>
                      </div>
                      <Button
                        variant="primary"
                        fullWidth
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
                      >
                        Upgrade to Pro - $9/month
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`rounded-lg p-4 ${
                          isDark
                            ? "bg-green-950/30 border border-green-900/50"
                            : "bg-green-50 border border-green-100"
                        }`}
                      >
                        <p
                          className={`text-sm ${
                            isDark ? "text-green-400" : "text-green-700"
                          }`}
                        >
                          ✓ Your Pro subscription is active
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        fullWidth
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
                      >
                        Manage Subscription
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
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
            }
          }}
          onCancel={closePaywall}
        />
      )}
    </>
  );
}
