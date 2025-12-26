import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrepStore } from "../stores/prepStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { getDeviceToken } from "../lib/supabase";
import {
  DateCalendar,
  ShiftToggle,
  PrepItemForm,
  PrepItemList,
  ProgressBar,
} from "../components";
import { toLocalDate } from "../lib/dateUtils";

export function StationView() {
  const { id: stationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    prepItems,
    loadPrepItems,
    toggleComplete,
    addPrepItem,
    deletePrepItem,
  } = usePrepStore();
  const {
    stations,
    sessionUser,
    currentKitchen,
    selectedDate,
    setSelectedDate,
  } = useKitchenStore();
  const [currentShift, setCurrentShift] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const station = stations.find((s) => s.id === stationId);

  // Get day name for selected date
  const selectedDateObj = toLocalDate(selectedDate);
  const dayName = selectedDateObj
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  // Check if selected day is closed
  const isClosed = currentKitchen?.closed_days?.includes(dayName) || false;

  // Get available shifts for selected date
  const availableShifts: string[] = isClosed
    ? []
    : currentKitchen?.schedule
    ? (currentKitchen.schedule as any).default ||
      (currentKitchen.schedule as any)[dayName] || ["AM", "PM"]
    : ["AM", "PM"];

  // Subscribe to real-time updates
  useRealtimePrepItems(stationId);

  // Set initial shift when kitchen loads or date changes
  useEffect(() => {
    if (currentKitchen && availableShifts.length > 0) {
      // Reset to first shift when date changes or if current shift isn't available
      if (!currentShift || !availableShifts.includes(currentShift)) {
        setCurrentShift(availableShifts[0]);
      }
    }
  }, [currentKitchen, availableShifts, selectedDate]);

  useEffect(() => {
    if (!stationId || !currentShift) return;
    loadPrepItems(stationId, selectedDate, currentShift);
  }, [stationId, selectedDate, currentShift, loadPrepItems]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationId || !newItemDescription.trim()) return;

    const deviceToken = getDeviceToken();

    await addPrepItem({
      station_id: stationId,
      shift_date: selectedDate,
      shift_name: currentShift,
      description: newItemDescription.trim(),
      quantity_raw: newItemQuantity.trim(),
      completed: false,
      created_by: sessionUser?.id || deviceToken,
    });

    setNewItemDescription("");
    setNewItemQuantity("");
    inputRef.current?.focus();
  };

  const handleToggle = async (itemId: string) => {
    await toggleComplete(itemId);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm("Delete this prep item?")) {
      await deletePrepItem(itemId);
    }
  };

  if (!station) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-slate-400 mb-4">
            Station not found
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = prepItems.filter((item) => item.completed).length;
  const totalCount = prepItems.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              ← Back
            </button>
            <DateCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              closedDays={currentKitchen?.closed_days || []}
            />
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Shift Toggle or Closed Notice */}
          <div className="flex items-center justify-center">
            <ShiftToggle
              shifts={availableShifts}
              currentShift={currentShift}
              onShiftChange={setCurrentShift}
              disabled={isClosed}
            />
          </div>

          {/* Progress */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400 mb-1">
                <span>
                  {completedCount} of {totalCount} complete
                </span>
                <span>{Math.round((completedCount / totalCount) * 100)}%</span>
              </div>
              <ProgressBar completed={completedCount} total={totalCount} />
            </div>
          )}
        </div>
      </header>

      {/* Prep Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {isClosed ? (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            <p className="text-lg mb-2">Kitchen is closed on this day</p>
            <p className="text-sm">Select a different date to add prep items</p>
          </div>
        ) : (
          <PrepItemList
            items={prepItems}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* Add Item Form - Sticky Bottom */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-lg dark:shadow-xl">
          <div className="max-w-3xl mx-auto">
            <PrepItemForm
              description={newItemDescription}
              quantity={newItemQuantity}
              onDescriptionChange={setNewItemDescription}
              onQuantityChange={setNewItemQuantity}
              onSubmit={handleAddItem}
            />
          </div>
        </div>
      )}
    </div>
  );
}
