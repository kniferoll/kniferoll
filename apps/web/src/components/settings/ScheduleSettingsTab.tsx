import { useState, useEffect, useCallback, useRef } from "react";
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
import { ConfirmDeleteShiftModal } from "../modals/ConfirmDeleteShiftModal";
import { ConfirmHideShiftModal } from "../modals/ConfirmHideShiftModal";
import { NewShiftModal } from "../modals/NewShiftModal";

interface ScheduleSettingsTabProps {
  kitchenId: string;
  isOwner: boolean;
}

interface LocalShift {
  id: string;
  name: string;
  display_order: number;
  is_hidden: boolean;
}

interface LocalDayConfig {
  dayIndex: number;
  isOpen: boolean;
  shiftIds: string[];
}

export function ScheduleSettingsTab({
  kitchenId,
  isOwner,
}: ScheduleSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { shifts, shiftDays, loading, refetch } = useKitchenShifts(kitchenId);
  const {
    addShift,
    deleteShift,
    hideShift,
    unhideShift,
    updateShift,
    updateShiftDay,
  } = useKitchenShiftActions(kitchenId);
  const [newShiftName, setNewShiftName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  // Local state for editable data
  const [localShifts, setLocalShifts] = useState<LocalShift[]>([]);
  const [localDays, setLocalDays] = useState<LocalDayConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Hide modal state
  const [hideModalOpen, setHideModalOpen] = useState(false);
  const [shiftToHide, setShiftToHide] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // New shift modal state
  const [newShiftModalOpen, setNewShiftModalOpen] = useState(false);
  const [pendingNewShift, setPendingNewShift] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Initialize local state from server data
  useEffect(() => {
    if (!loading && shifts) {
      setLocalShifts(
        shifts.map((s) => ({
          id: s.id,
          name: s.name,
          display_order: s.display_order ?? 0,
          is_hidden: s.is_hidden ?? false,
        }))
      );
    }
  }, [shifts, loading]);

  useEffect(() => {
    if (!loading && shifts) {
      // Initialize all 7 days with their current state, including shift assignments
      const days: LocalDayConfig[] = DAYS_OF_WEEK.map((_, dayIndex) => {
        const existing = shiftDays.find((d) => d.day_of_week === dayIndex);
        // Default: if no config exists, all shifts are active on this day
        const defaultShiftIds = shifts.map((s) => s.id);
        return {
          dayIndex,
          isOpen: existing?.is_open ?? true,
          shiftIds: existing?.shift_ids ?? defaultShiftIds,
        };
      });
      setLocalDays(days);
    }
  }, [shiftDays, shifts, loading]);

  // Check if there are unsaved changes
  const checkForChanges = useCallback(() => {
    // Check shifts order
    const shiftsChanged = localShifts.some((local) => {
      const original = shifts.find((s) => s.id === local.id);
      return original && original.display_order !== local.display_order;
    });

    // Check days - both isOpen and shiftIds
    const daysChanged = localDays.some((local) => {
      const original = shiftDays.find((d) => d.day_of_week === local.dayIndex);
      const defaultShiftIds = shifts.map((s) => s.id);
      const originalIsOpen = original?.is_open ?? true;
      const originalShiftIds = original?.shift_ids ?? defaultShiftIds;

      // Compare isOpen
      if (local.isOpen !== originalIsOpen) return true;

      // Compare shiftIds arrays
      const localSorted = [...local.shiftIds].sort();
      const originalSorted = [...originalShiftIds].sort();
      if (localSorted.length !== originalSorted.length) return true;
      return localSorted.some((id, i) => id !== originalSorted[i]);
    });

    setHasChanges(shiftsChanged || daysChanged);
  }, [localShifts, localDays, shifts, shiftDays]);

  useEffect(() => {
    checkForChanges();
  }, [checkForChanges]);

  // Drag state for reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  // Handle drag end - reorder the shifts
  const handleDragEnd = () => {
    if (
      draggedIndex !== null &&
      dragOverIndex !== null &&
      draggedIndex !== dragOverIndex
    ) {
      const newShifts = [...localShifts];
      const [draggedItem] = newShifts.splice(draggedIndex, 1);
      newShifts.splice(dragOverIndex, 0, draggedItem);
      // Update display_order values
      newShifts.forEach((s, i) => {
        s.display_order = i;
      });
      setLocalShifts(newShifts);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [touchCurrentY, setTouchCurrentY] = useState<number>(0);
  const shiftRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!isOwner || localShifts.length <= 1) return;
    setTouchDragIndex(index);
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null) return;
    e.preventDefault();
    setTouchCurrentY(e.touches[0].clientY);
  };

  // Handle touch end - calculate new position and reorder
  const handleTouchEnd = () => {
    if (touchDragIndex === null) return;

    const dragDistance = touchCurrentY - touchStartY;
    const itemHeight = 52; // Approximate height of each shift item
    const indexDelta = Math.round(dragDistance / itemHeight);
    const newIndex = Math.max(
      0,
      Math.min(localShifts.length - 1, touchDragIndex + indexDelta)
    );

    if (newIndex !== touchDragIndex) {
      const newShifts = [...localShifts];
      const [draggedItem] = newShifts.splice(touchDragIndex, 1);
      newShifts.splice(newIndex, 0, draggedItem);
      // Update display_order values
      newShifts.forEach((s, i) => {
        s.display_order = i;
      });
      setLocalShifts(newShifts);
    }

    setTouchDragIndex(null);
    setTouchStartY(0);
    setTouchCurrentY(0);
  };

  // Move shift up in order (for accessibility)
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

  // Move shift down in order (for accessibility)
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

  // Toggle a shift for a specific day
  const toggleShiftForDay = (dayIndex: number, shiftId: string) => {
    setLocalDays((prev) =>
      prev.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const hasShift = d.shiftIds.includes(shiftId);
        const newShiftIds = hasShift
          ? d.shiftIds.filter((id) => id !== shiftId)
          : [...d.shiftIds, shiftId];
        // If no shifts selected, mark day as closed
        const isOpen = newShiftIds.length > 0;
        return { ...d, shiftIds: newShiftIds, isOpen };
      })
    );
  };

  // Toggle all shifts for a day (select all / deselect all)
  const toggleAllShiftsForDay = (dayIndex: number) => {
    setLocalDays((prev) =>
      prev.map((d) => {
        if (d.dayIndex !== dayIndex) return d;
        const allShiftIds = localShifts.map((s) => s.id);
        const allSelected = allShiftIds.every((id) => d.shiftIds.includes(id));
        if (allSelected) {
          // Deselect all - mark day as closed
          return { ...d, shiftIds: [], isOpen: false };
        } else {
          // Select all
          return { ...d, shiftIds: allShiftIds, isOpen: true };
        }
      })
    );
  };

  // Cancel changes - reset to server state
  const handleCancel = () => {
    const defaultShiftIds = shifts.map((s) => s.id);
    setLocalShifts(
      shifts.map((s) => ({
        id: s.id,
        name: s.name,
        display_order: s.display_order ?? 0,
        is_hidden: s.is_hidden ?? false,
      }))
    );
    setLocalDays(
      DAYS_OF_WEEK.map((_, dayIndex) => {
        const existing = shiftDays.find((d) => d.day_of_week === dayIndex);
        return {
          dayIndex,
          isOpen: existing?.is_open ?? true,
          shiftIds: existing?.shift_ids ?? defaultShiftIds,
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

      // Update operating days with shift assignments
      const defaultShiftIds = shifts.map((s) => s.id);
      for (const local of localDays) {
        const original = shiftDays.find(
          (d) => d.day_of_week === local.dayIndex
        );
        const originalIsOpen = original?.is_open ?? true;
        const originalShiftIds = original?.shift_ids ?? defaultShiftIds;

        // Check if anything changed
        const localSorted = [...local.shiftIds].sort();
        const originalSorted = [...originalShiftIds].sort();
        const shiftIdsChanged =
          localSorted.length !== originalSorted.length ||
          localSorted.some((id, i) => id !== originalSorted[i]);

        if (local.isOpen !== originalIsOpen || shiftIdsChanged) {
          await updateShiftDay(local.dayIndex, local.isOpen, local.shiftIds);
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
      const shiftId = await addShift(newShiftName);
      const shiftName = newShiftName;
      setNewShiftName("");

      // Show modal to ask about applying to days
      setPendingNewShift({ id: shiftId, name: shiftName });
      setNewShiftModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add shift");
    }
  };

  const handleNewShiftDaysChoice = async (applyToAllDays: boolean) => {
    if (!pendingNewShift) return;

    try {
      if (applyToAllDays) {
        // Add the new shift to all days
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const existingDay = shiftDays.find((d) => d.day_of_week === dayIndex);
          const existingShiftIds =
            existingDay?.shift_ids ?? shifts.map((s) => s.id);
          // Add the new shift ID if not already present
          const newShiftIds = existingShiftIds.includes(pendingNewShift.id)
            ? existingShiftIds
            : [...existingShiftIds, pendingNewShift.id];
          await updateShiftDay(dayIndex, true, newShiftIds);
        }
      }
      // If not applying to all days, the shift exists but isn't assigned to any days

      setSuccess(`Shift "${pendingNewShift.name}" added`);
      refetch();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update schedule"
      );
    } finally {
      setPendingNewShift(null);
    }
  };

  const handleDeleteShift = (shiftId: string, shiftName: string) => {
    setShiftToDelete({ id: shiftId, name: shiftName });
    setDeleteModalOpen(true);
  };

  const handleHideShift = (shiftId: string, shiftName: string) => {
    setShiftToHide({ id: shiftId, name: shiftName });
    setHideModalOpen(true);
  };

  const confirmDeleteShift = async () => {
    if (!shiftToDelete) return;

    setError("");
    setSuccess("");

    await deleteShift(shiftToDelete.id);
    setSuccess("Shift deleted");
    refetch();
    setShiftToDelete(null);
  };

  // Called from delete modal's "Hide Instead" option
  const confirmHideShiftFromDeleteModal = async () => {
    if (!shiftToDelete) return;

    setError("");
    setSuccess("");

    await hideShift(shiftToDelete.id);
    setSuccess("Shift hidden");
    refetch();
    setShiftToDelete(null);
  };

  // Called from dedicated hide modal
  const confirmHideShift = async () => {
    if (!shiftToHide) return;

    setError("");
    setSuccess("");

    await hideShift(shiftToHide.id);
    setSuccess("Shift hidden");
    refetch();
    setShiftToHide(null);
  };

  const handleUnhideShift = async (shiftId: string) => {
    setError("");
    setSuccess("");

    try {
      await unhideShift(shiftId);
      setSuccess("Shift unhidden");
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unhide shift");
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

      {/* Shifts with Reordering */}
      <SettingsSection
        title="Kitchen Shifts"
        description="Define your shifts. Drag to reorder."
      >
        <div
          className={`rounded-xl border ${
            isDark
              ? "bg-slate-800/50 border-slate-700/50"
              : "bg-stone-50 border-stone-200"
          }`}
        >
          <div className="p-2.5 space-y-1.5">
            {loading ? (
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                Loading shifts...
              </p>
            ) : localShifts.length === 0 ? (
              <p
                className={`text-sm ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              >
                No shifts defined yet. Add your first shift below.
              </p>
            ) : (
              localShifts.map((shift, index) => {
                const isDragging = draggedIndex === index;
                const isDragOver = dragOverIndex === index;
                const isTouchDragging = touchDragIndex === index;
                const touchOffset = isTouchDragging
                  ? touchCurrentY - touchStartY
                  : 0;

                return (
                  <div
                    key={shift.id}
                    ref={(el) => {
                      shiftRefs.current[index] = el;
                    }}
                    draggable={
                      isOwner && localShifts.length > 1 && !shift.is_hidden
                    }
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => setDragOverIndex(null)}
                    style={{
                      transform: isTouchDragging
                        ? `translateY(${touchOffset}px)`
                        : undefined,
                      transition: isTouchDragging
                        ? "none"
                        : "transform 0.15s ease",
                      zIndex: isTouchDragging ? 50 : undefined,
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg border transition-all ${
                      shift.is_hidden
                        ? isDark
                          ? "bg-slate-900/50 border-slate-700/50 opacity-60"
                          : "bg-stone-100 border-stone-200/50 opacity-60"
                        : isDark
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-stone-200"
                    } ${
                      isDragging || isTouchDragging
                        ? "opacity-70 scale-[1.02] shadow-lg"
                        : ""
                    } ${
                      isDragOver
                        ? isDark
                          ? "border-orange-500 bg-slate-800"
                          : "border-orange-400 bg-orange-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Drag handle - only show for non-hidden shifts */}
                      {isOwner &&
                        localShifts.length > 1 &&
                        !shift.is_hidden && (
                          <div
                            className={`touch-none select-none p-0.5 rounded cursor-grab active:cursor-grabbing ${
                              isDark
                                ? "text-slate-400 hover:text-slate-300 hover:bg-slate-700"
                                : "text-stone-400 hover:text-stone-600 hover:bg-stone-100"
                            }`}
                            onTouchStart={(e) => handleTouchStart(e, index)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            title="Drag to reorder"
                            aria-label={`Reorder ${shift.name}. Use up and down keys.`}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => {
                              if (e.key === "ArrowUp") {
                                e.preventDefault();
                                moveShiftUp(index);
                              } else if (e.key === "ArrowDown") {
                                e.preventDefault();
                                moveShiftDown(index);
                              }
                            }}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                            </svg>
                          </div>
                        )}
                      <span
                        className={`text-sm font-medium ${
                          shift.is_hidden
                            ? isDark
                              ? "text-slate-400"
                              : "text-gray-500"
                            : isDark
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        {shift.name}
                        {shift.is_hidden && (
                          <span
                            className={`ml-1.5 text-[10px] font-normal px-1.5 py-0.5 rounded ${
                              isDark
                                ? "bg-slate-700 text-slate-400"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            Hidden
                          </span>
                        )}
                      </span>
                    </div>
                    {isOwner &&
                      (shift.is_hidden ? (
                        <button
                          onClick={() => handleUnhideShift(shift.id)}
                          className={`text-xs font-medium cursor-pointer ${
                            isDark
                              ? "text-slate-400 hover:text-slate-300"
                              : "text-stone-500 hover:text-stone-700"
                          }`}
                        >
                          Unhide
                        </button>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleHideShift(shift.id, shift.name)
                            }
                            className={`text-xs font-medium cursor-pointer ${
                              isDark
                                ? "text-slate-400 hover:text-slate-300"
                                : "text-stone-500 hover:text-stone-700"
                            }`}
                          >
                            Hide
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteShift(shift.id, shift.name)
                            }
                            className="text-xs font-medium text-red-500 hover:text-red-600 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                  </div>
                );
              })
            )}
          </div>

          {isOwner && (
            <div
              className={`border-t p-2.5 ${
                isDark ? "border-slate-700/50" : "border-stone-200"
              }`}
            >
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormInput
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddShift()}
                    placeholder="Shift name (e.g., Dinner)"
                  />
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddShift}
                  disabled={!newShiftName.trim()}
                  className="text-sm px-4"
                >
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* Weekly Schedule - Per-Day Shift Assignment */}
      <SettingsSection
        title="Weekly Schedule"
        description="Configure which shifts run each day"
      >
        <div className="space-y-1.5">
          {DAYS_OF_WEEK.map((day, dayIndex) => {
            const dayConfig = localDays.find((d) => d.dayIndex === dayIndex);
            const activeShiftIds = dayConfig?.shiftIds ?? [];
            const allSelected =
              localShifts.length > 0 &&
              localShifts.every((s) => activeShiftIds.includes(s.id));
            const isOpen = dayConfig?.isOpen ?? true;

            return (
              <div
                key={dayIndex}
                className={`rounded-xl border overflow-hidden ${
                  isDark
                    ? isOpen
                      ? "border-slate-700/50 bg-slate-800/50"
                      : "border-slate-700/30 bg-slate-800/30"
                    : isOpen
                    ? "border-stone-200 bg-white"
                    : "border-stone-200/50 bg-stone-50"
                }`}
              >
                {/* Day header */}
                <div
                  className={`flex items-center justify-between px-3 py-2.5 ${
                    isDark ? "" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium min-w-[70px] sm:min-w-[80px] ${
                        isDark ? "text-white" : "text-gray-900"
                      } ${!isOpen ? "opacity-50" : ""}`}
                    >
                      {day}
                    </span>
                    {!isOpen && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          isDark
                            ? "bg-slate-700 text-slate-400"
                            : "bg-stone-200 text-stone-500"
                        }`}
                      >
                        Closed
                      </span>
                    )}
                    {isOpen && activeShiftIds.length > 0 && (
                      <span
                        className={`text-[10px] ${
                          isDark ? "text-slate-400" : "text-stone-500"
                        }`}
                      >
                        {activeShiftIds.length} shift
                        {activeShiftIds.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {isOwner && localShifts.length > 0 && (
                    <button
                      onClick={() => toggleAllShiftsForDay(dayIndex)}
                      className={`text-xs font-medium transition-colors ${
                        isDark
                          ? "text-orange-400 hover:text-orange-300"
                          : "text-orange-600 hover:text-orange-700"
                      }`}
                    >
                      {allSelected ? "Clear" : "All"}
                    </button>
                  )}
                </div>

                {/* Shift checkboxes */}
                {localShifts.length === 0 ? (
                  <div className="px-3 py-2">
                    <p
                      className={`text-xs ${
                        isDark ? "text-slate-400" : "text-stone-500"
                      }`}
                    >
                      No shifts defined. Add shifts above first.
                    </p>
                  </div>
                ) : (
                  <div className="px-3 py-2.5 flex flex-wrap gap-2">
                    {localShifts.map((shift) => {
                      const isActive = activeShiftIds.includes(shift.id);
                      return (
                        <label
                          key={shift.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-xs font-medium ${
                            isDark
                              ? isActive
                                ? "bg-orange-500/20 ring-1 ring-orange-500/40 text-orange-300"
                                : "bg-slate-700/50 ring-1 ring-slate-600/50 text-slate-300 hover:bg-slate-700"
                              : isActive
                              ? "bg-orange-50 ring-1 ring-orange-200 text-orange-700"
                              : "bg-white ring-1 ring-stone-200 text-stone-600 hover:bg-stone-50"
                          } ${!isOwner ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() =>
                              isOwner && toggleShiftForDay(dayIndex, shift.id)
                            }
                            disabled={!isOwner}
                            className="sr-only"
                          />
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-colors ${
                              isActive
                                ? "bg-orange-500"
                                : isDark
                                ? "bg-slate-600 ring-1 ring-slate-500"
                                : "bg-stone-200 ring-1 ring-stone-300"
                            }`}
                          >
                            {isActive && (
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                          <span className="font-medium">{shift.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsSection>

      {/* Save/Cancel Buttons */}
      {isOwner && hasChanges && (
        <div
          className={`sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 border-t ${
            isDark
              ? "bg-slate-900/95 border-slate-700/50 backdrop-blur-sm"
              : "bg-white/95 border-stone-200 backdrop-blur-sm"
          }`}
        >
          <div className="flex items-center justify-end gap-2">
            <span
              className={`text-xs mr-auto ${
                isDark ? "text-amber-400/80" : "text-amber-600"
              }`}
            >
              Unsaved changes
            </span>
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={saving}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
              className="text-sm"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Delete Shift Confirmation Modal */}
      <ConfirmDeleteShiftModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setShiftToDelete(null);
        }}
        onConfirm={confirmDeleteShift}
        onHide={confirmHideShiftFromDeleteModal}
        shiftName={shiftToDelete?.name ?? ""}
      />

      {/* Hide Shift Confirmation Modal */}
      <ConfirmHideShiftModal
        isOpen={hideModalOpen}
        onClose={() => {
          setHideModalOpen(false);
          setShiftToHide(null);
        }}
        onConfirm={confirmHideShift}
        shiftName={shiftToHide?.name ?? ""}
      />

      {/* New Shift Days Modal */}
      <NewShiftModal
        isOpen={newShiftModalOpen}
        onClose={() => {
          setNewShiftModalOpen(false);
          setPendingNewShift(null);
          refetch();
        }}
        onConfirm={handleNewShiftDaysChoice}
        shiftName={pendingNewShift?.name ?? ""}
      />
    </>
  );
}
