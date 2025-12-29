import { useState } from "react";
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

interface ScheduleSettingsTabProps {
  kitchenId: string;
  isOwner: boolean;
}

export function ScheduleSettingsTab({
  kitchenId,
  isOwner,
}: ScheduleSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { shifts, shiftDays, loading } = useKitchenShifts(kitchenId);
  const { addShift, deleteShift, updateShiftDay } =
    useKitchenShiftActions(kitchenId);
  const [newShiftName, setNewShiftName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    <div className="space-y-8">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Shifts */}
      <SettingsSection
        title="Kitchen Shifts"
        description="Define the shifts your kitchen runs"
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
            ) : shifts.length === 0 ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No custom shifts yet. Using default shifts (Breakfast, Lunch,
                Dinner).
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
                  <span
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {shift.name}
                  </span>
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
            const dayConfig = shiftDays.find((d) => d.day_of_week === dayIndex);
            const isOpen = dayConfig?.is_open ?? true;

            return (
              <label
                key={dayIndex}
                className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                  isDark
                    ? "border-slate-600 hover:bg-slate-800"
                    : "border-stone-300 hover:bg-stone-50"
                } ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => updateShiftDay(dayIndex, e.target.checked)}
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
    </div>
  );
}
