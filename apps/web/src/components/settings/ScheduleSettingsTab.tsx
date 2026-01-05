import { useState, useEffect } from "react";
import { useDarkModeContext } from "@/context";
import { useKitchenShifts, useKitchenShiftActions, DAYS_OF_WEEK } from "@/hooks";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { SettingsSection } from "../ui/SettingsSection";

interface ScheduleSettingsTabProps {
  kitchenId: string;
  isOwner: boolean;
}

export function ScheduleSettingsTab({ kitchenId, isOwner }: ScheduleSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { shifts, shiftDays, loading } = useKitchenShifts(kitchenId);
  const { addShift, deleteShift, reorderShifts, updateShiftDay } =
    useKitchenShiftActions(kitchenId);
  const [newShiftName, setNewShiftName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Local state for optimistic drag reordering
  const [localShifts, setLocalShifts] = useState(shifts);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number>(0);

  // Schedule mode state
  const [scheduleMode, setScheduleMode] = useState<"same" | "varies">("same");

  // Sync local shifts with server shifts
  useEffect(() => {
    setLocalShifts(shifts);
  }, [shifts]);

  // Determine initial schedule mode from shift days data
  useEffect(() => {
    if (shiftDays.length === 0) return;

    // Check if all open days have the same shifts
    const openDays = shiftDays.filter((d) => d.is_open);
    if (openDays.length === 0) return;

    const firstDayShifts = JSON.stringify([...(openDays[0].shift_ids || [])].sort());
    const allSame = openDays.every(
      (d) => JSON.stringify([...(d.shift_ids || [])].sort()) === firstDayShifts
    );

    setScheduleMode(allSame ? "same" : "varies");
  }, [shiftDays]);

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

  // Desktop drag handlers
  const handleDragStart = (index: number) => {
    if (!isOwner) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !isOwner) return;

    const newShifts = [...localShifts];
    const [draggedItem] = newShifts.splice(draggedIndex, 1);
    newShifts.splice(dropIndex, 0, draggedItem);

    // Optimistic update
    setLocalShifts(newShifts);
    setDraggedIndex(null);

    // Persist to server
    try {
      await reorderShifts(newShifts.map((s) => s.id));
      setSuccess("Shifts reordered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder shifts");
      setLocalShifts(shifts); // Revert on error
    }
  };

  // Mobile touch handlers
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!isOwner) return;
    setTouchDragIndex(index);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = async (e: React.TouchEvent) => {
    if (touchDragIndex === null || !isOwner) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY;
    const itemHeight = 56;
    const movement = Math.round(diff / itemHeight);

    if (movement !== 0) {
      const newIndex = touchDragIndex + movement;
      if (newIndex >= 0 && newIndex < localShifts.length && newIndex !== touchDragIndex) {
        const newShifts = [...localShifts];
        const [item] = newShifts.splice(touchDragIndex, 1);
        newShifts.splice(newIndex, 0, item);
        setLocalShifts(newShifts);
        setTouchDragIndex(newIndex);
        setTouchStartY(currentY);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (touchDragIndex === null || !isOwner) return;
    setTouchDragIndex(null);

    // Persist to server
    try {
      await reorderShifts(localShifts.map((s) => s.id));
      setSuccess("Shifts reordered");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder shifts");
      setLocalShifts(shifts);
    }
  };

  // Toggle shift for a specific day
  const handleToggleShiftForDay = async (dayIndex: number, shiftId: string) => {
    if (!isOwner) return;
    setError("");

    const dayConfig = shiftDays.find((d) => d.day_of_week === dayIndex);
    const currentShiftIds = dayConfig?.shift_ids || [];
    const isOpen = dayConfig?.is_open ?? true;

    let newShiftIds: string[];
    if (currentShiftIds.includes(shiftId)) {
      newShiftIds = currentShiftIds.filter((id) => id !== shiftId);
    } else {
      newShiftIds = [...currentShiftIds, shiftId];
    }

    try {
      await updateShiftDay(dayIndex, isOpen, newShiftIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shifts");
    }
  };

  return (
    <div className="space-y-8">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Shifts with Reordering */}
      <SettingsSection
        title="Kitchen Shifts"
        description="Define and reorder your kitchen's shifts"
      >
        <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-stone-50"}`}>
          <div className="space-y-2 mb-4">
            {loading ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading shifts...</p>
            ) : localShifts.length === 0 ? (
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                No shifts configured. Add your first shift below.
              </p>
            ) : (
              <>
                {isOwner && localShifts.length > 1 && (
                  <p className={`text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Drag to reorder shifts
                  </p>
                )}
                {localShifts.map((shift, index) => (
                  <div
                    key={shift.id}
                    draggable={isOwner && localShifts.length > 1}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onTouchStart={
                      isOwner && localShifts.length > 1
                        ? (e) => handleTouchStart(e, index)
                        : undefined
                    }
                    onTouchMove={isOwner && localShifts.length > 1 ? handleTouchMove : undefined}
                    onTouchEnd={isOwner && localShifts.length > 1 ? handleTouchEnd : undefined}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all select-none ${
                      isDark ? "bg-slate-900 border-slate-700" : "bg-white border-stone-200"
                    } ${
                      draggedIndex === index || touchDragIndex === index
                        ? "opacity-50 scale-95"
                        : ""
                    } ${
                      isOwner && localShifts.length > 1
                        ? touchDragIndex !== null
                          ? ""
                          : "cursor-move"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isOwner && localShifts.length > 1 && (
                        <span className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          ⋮⋮
                        </span>
                      )}
                      <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {shift.name}
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShift(shift.id);
                        }}
                        className="text-red-500 hover:text-red-600 font-medium cursor-pointer"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {isOwner && (
            <div className={`border-t pt-4 ${isDark ? "border-slate-700" : "border-stone-200"}`}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormInput
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddShift()}
                    placeholder="Shift name (e.g., Late Dinner)"
                  />
                </div>
                <Button variant="primary" onClick={handleAddShift} disabled={!newShiftName.trim()}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Operating Days */}
      <SettingsSection title="Operating Days" description="Select which days your kitchen is open">
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
                  onChange={(e) => {
                    const currentShiftIds = dayConfig?.shift_ids || localShifts.map((s) => s.id);
                    updateShiftDay(dayIndex, e.target.checked, currentShiftIds);
                  }}
                  disabled={!isOwner}
                  className="w-4 h-4 accent-orange-500"
                />
                <span className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                  {day}
                </span>
              </label>
            );
          })}
        </div>
      </SettingsSection>

      {/* Shift-Day Mapping */}
      {localShifts.length > 0 && (
        <SettingsSection
          title="Shift Schedule"
          description="Configure which shifts run on each day"
        >
          <div className={`rounded-xl p-4 ${isDark ? "bg-slate-800" : "bg-stone-50"}`}>
            {/* Schedule Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setScheduleMode("same")}
                disabled={!isOwner}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                } ${
                  scheduleMode === "same"
                    ? "border-orange-500 bg-orange-500/10"
                    : isDark
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Same every day
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      All open days run the same shifts
                    </div>
                  </div>
                  {scheduleMode === "same" && <span className="text-orange-500 text-xl">✓</span>}
                </div>
              </button>

              <button
                onClick={() => setScheduleMode("varies")}
                disabled={!isOwner}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                } ${
                  scheduleMode === "varies"
                    ? "border-orange-500 bg-orange-500/10"
                    : isDark
                      ? "border-slate-700 hover:border-slate-600"
                      : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      Varies by day
                    </div>
                    <div className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Configure each day separately
                    </div>
                  </div>
                  {scheduleMode === "varies" && <span className="text-orange-500 text-xl">✓</span>}
                </div>
              </button>
            </div>

            {/* Per-Day Configuration (only shown when "varies" mode is selected) */}
            {scheduleMode === "varies" && (
              <div
                className={`border-t pt-6 space-y-4 ${
                  isDark ? "border-slate-700" : "border-stone-200"
                }`}
              >
                <h3 className={`font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                  Configure each day:
                </h3>
                {DAYS_OF_WEEK.map((day, dayIndex) => {
                  const dayConfig = shiftDays.find((d) => d.day_of_week === dayIndex);
                  const isOpen = dayConfig?.is_open ?? true;
                  const dayShiftIds = dayConfig?.shift_ids || [];

                  if (!isOpen) {
                    return (
                      <div key={dayIndex} className="flex items-center justify-between py-2">
                        <span
                          className={`font-medium w-24 ${
                            isDark ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          {day}
                        </span>
                        <span className={`italic ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          Closed
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={dayIndex} className="flex items-start gap-3">
                      <span
                        className={`font-medium w-24 pt-2 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-2">
                        {localShifts.map((shift) => (
                          <button
                            key={shift.id}
                            onClick={() => handleToggleShiftForDay(dayIndex, shift.id)}
                            disabled={!isOwner}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              isOwner ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                            } ${
                              dayShiftIds.includes(shift.id)
                                ? "bg-orange-500 text-white"
                                : isDark
                                  ? "bg-slate-700 text-gray-300 hover:bg-slate-600"
                                  : "bg-stone-100 text-gray-700 hover:bg-stone-200"
                            }`}
                          >
                            {dayShiftIds.includes(shift.id) && "✓ "}
                            {shift.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </SettingsSection>
      )}
    </div>
  );
}
