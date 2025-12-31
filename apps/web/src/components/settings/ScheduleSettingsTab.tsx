import { useState, useEffect, useCallback } from "react";
import { useDarkModeContext } from "@/context";
import {
  useKitchenShifts,
  useKitchenShiftActions,
  DAYS_OF_WEEK,
} from "@/hooks";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";
import type { Database } from "@kniferoll/types";

type KitchenShift = Database["public"]["Tables"]["kitchen_shifts"]["Row"];

interface ScheduleSettingsTabProps {
  kitchenId: string;
  isOwner: boolean;
}

interface LocalShift {
  id: string;
  name: string;
  display_order: number;
}

interface LocalDayConfig {
  dayIndex: number;
  isOpen: boolean;
}

export function ScheduleSettingsTab({
  kitchenId,
  isOwner,
}: ScheduleSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { shifts, shiftDays, loading } = useKitchenShifts(kitchenId);
  const { addShift, deleteShift, updateShift, updateShiftDay } =
    useKitchenShiftActions(kitchenId);
  const [newShiftName, setNewShiftName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Local state for editable data
  const [localShifts, setLocalShifts] = useState<LocalShift[]>([]);
  const [localDays, setLocalDays] = useState<LocalDayConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local state from server data
  useEffect(() => {
    if (!loading && shifts) {
      setLocalShifts(
        shifts.map((s) => ({
          id: s.id,
          name: s.name,
          display_order: s.display_order ?? 0,
        }))
      );
    }
  }, [shifts, loading]);

  useEffect(() => {
    if (!loading) {
      // Initialize all 7 days with their current state
      const days: LocalDayConfig[] = DAYS_OF_WEEK.map((_, dayIndex) => {
        const existing = shiftDays.find((d) => d.day_of_week === dayIndex);
        return {
          dayIndex,
          isOpen: existing?.is_open ?? true, // Default to open
        };
      });
      setLocalDays(days);
    }
  }, [shiftDays, loading]);

  // Check if there are unsaved changes
  const checkForChanges = useCallback(() => {
    // Check shifts order
    const shiftsChanged = localShifts.some((local) => {
      const original = shifts.find((s) => s.id === local.id);
      return original && original.display_order !== local.display_order;
    });

    // Check days
    const daysChanged = localDays.some((local) => {
      const original = shiftDays.find((d) => d.day_of_week === local.dayIndex);
      const originalIsOpen = original?.is_open ?? true;
      return local.isOpen !== originalIsOpen;
    });

    setHasChanges(shiftsChanged || daysChanged);
  }, [localShifts, localDays, shifts, shiftDays]);

  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Move shift up in order
  const moveShiftUp = (index: number) => {
    if (index === 0) return;
    const newShifts = [...localShifts];
    const temp = newShifts[index - 1];
    newShifts[index - 1] = newShifts[index];
    newShifts[index] = temp;
    // Update display_order values
    newShifts.forEach((s, i) => {
      s.display_order = i;
    });
    setLocalShifts(newShifts);
  };

  // Move shift down in order
  const moveShiftDown = (index: number) => {
    if (index === localShifts.length - 1) return;
    const newShifts = [...localShifts];
    const temp = newShifts[index + 1];
    newShifts[index + 1] = newShifts[index];
    newShifts[index] = temp;
    // Update display_order values
    newShifts.forEach((s, i) => {
      s.display_order = i;
    });
    setLocalShifts(newShifts);
  };

  // Toggle day open/closed
  const toggleDay = (dayIndex: number) => {
    setLocalDays((prev) =>
      prev.map((d) =>
        d.dayIndex === dayIndex ? { ...d, isOpen: !d.isOpen } : d
      )
    );
  };

  // Cancel changes - reset to server state
  const handleCancel = () => {
    setLocalShifts(
      shifts.map((s) => ({
        id: s.id,
        name: s.name,
        display_order: s.display_order ?? 0,
      }))
    );
    setLocalDays(
      DAYS_OF_WEEK.map((_, dayIndex) => {
        const existing = shiftDays.find((d) => d.day_of_week === dayIndex);
        return {
          dayIndex,
          isOpen: existing?.is_open ?? true,
        };
      })
    );
    setError("");
    setSuccess("");
  };

  // Save all changes
  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      // Update shift orders
      for (const local of localShifts) {
        const original = shifts.find((s) => s.id === local.id);
        if (original && original.display_order !== local.display_order) {
          await updateShift(local.id, { display_order: local.display_order });
        }
      }

      // Update operating days
      for (const local of localDays) {
        const original = shiftDays.find((d) => d.day_of_week === local.dayIndex);
        const originalIsOpen = original?.is_open ?? true;
        if (local.isOpen !== originalIsOpen) {
          await updateShiftDay(local.dayIndex, local.isOpen);
        }
      }

      setSuccess("Schedule updated successfully");
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleAddShift = async () => {
    if (!newShiftName.trim()) return;

    setError("");
    setSuccess("");

    try {
      await addShift(newShiftName);
      setNewShiftName("");
      setSuccess("Shift added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add shift");
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    setError("");
    setSuccess("");

    try {
      await deleteShift(shiftId);
      setSuccess("Shift deleted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete shift");
    }
  };

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

      {/* Shifts */}
      <SettingsSection
        title="Kitchen Shifts"
        description="Define the shifts your kitchen runs. Drag to reorder."
      >
        <div
          className={`rounded-xl p-4 ${
            isDark ? "bg-slate-800" : "bg-stone-50"
          }`}
        >
          <div className="space-y-2 mb-4">
            {loading ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Loading shifts...
              </p>
            ) : localShifts.length === 0 ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No shifts defined yet. Add your first shift below.
              </p>
            ) : (
              localShifts.map((shift, index) => (
                <div
                  key={shift.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isDark
                      ? "bg-slate-900 border-slate-700"
                      : "bg-white border-stone-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Reorder buttons */}
                    {isOwner && localShifts.length > 1 && (
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveShiftUp(index)}
                          disabled={index === 0}
                          className={`p-1 rounded transition-colors ${
                            index === 0
                              ? "opacity-30 cursor-not-allowed"
                              : isDark
                                ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                                : "hover:bg-stone-200 text-stone-500 hover:text-stone-800"
                          }`}
                          title="Move up"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 15l7-7 7 7"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveShiftDown(index)}
                          disabled={index === localShifts.length - 1}
                          className={`p-1 rounded transition-colors ${
                            index === localShifts.length - 1
                              ? "opacity-30 cursor-not-allowed"
                              : isDark
                                ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                                : "hover:bg-stone-200 text-stone-500 hover:text-stone-800"
                          }`}
                          title="Move down"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    <span
                      className={`font-semibold ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {shift.name}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteShift(shift.id)}
                      className="text-red-500 hover:text-red-600 font-medium cursor-pointer"
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
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormInput
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddShift()}
                    placeholder="Shift name (e.g., Late Dinner)"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddShift}
                  disabled={!newShiftName.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Operating Days */}
      <SettingsSection
        title="Operating Days"
        description="Select which days your kitchen is open"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DAYS_OF_WEEK.map((day, dayIndex) => {
            const dayConfig = localDays.find((d) => d.dayIndex === dayIndex);
            const isOpen = dayConfig?.isOpen ?? true;

            return (
              <label
                key={dayIndex}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  isDark
                    ? isOpen
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-slate-600 hover:bg-slate-800"
                    : isOpen
                      ? "border-orange-300 bg-orange-50"
                      : "border-stone-300 hover:bg-stone-50"
                } ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={() => isOwner && toggleDay(dayIndex)}
                  disabled={!isOwner}
                  className="w-4 h-4 accent-orange-500"
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
      </SettingsSection>

      {/* Save/Cancel Buttons */}
      {isOwner && (
        <div
          className={`sticky bottom-0 py-4 border-t ${
            isDark
              ? "bg-slate-900/95 border-slate-700 backdrop-blur-sm"
              : "bg-white/95 border-stone-200 backdrop-blur-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              {hasChanges && (
                <span
                  className={`text-sm ${
                    isDark ? "text-amber-400" : "text-amber-600"
                  }`}
                >
                  You have unsaved changes
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
