import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePrepStore } from "../stores/prepStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { useRealtimePrepItems } from "../hooks/useRealtimePrepItems";
import { getDeviceToken } from "../lib/supabase";

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
  const { stations, sessionUser, currentKitchen } = useKitchenStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentShift, setCurrentShift] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const station = stations.find((s) => s.id === stationId);
  
  // Get day name for selected date
  const selectedDateObj = new Date(selectedDate + "T12:00:00");
  const dayName = selectedDateObj.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  // Check if selected day is closed
  const isClosed = currentKitchen?.closed_days?.includes(dayName) || false;

  // Get available shifts for selected date
  const availableShifts: string[] = isClosed ? [] : (
    currentKitchen?.schedule
      ? (currentKitchen.schedule as any).default ||
        (currentKitchen.schedule as any)[dayName] ||
        ["AM", "PM"]
      : ["AM", "PM"]
  );

  // Date navigation helpers
  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate + "T12:00:00");
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  };

  const formatSelectedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    };
    return selectedDateObj.toLocaleDateString("en-US", options);
  };

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Station not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:underline"
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{station.name}</h1>
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-center mb-3">
            <button
              onClick={() => navigateDate(-1)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Previous day"
            >
              ←
            </button>
            <div className="px-6 py-2 min-w-45 text-center">
              <div className="text-sm font-semibold text-gray-900">
                {formatSelectedDate()}
              </div>
              {isToday && (
                <div className="text-xs text-blue-600 font-medium">Today</div>
              )}
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Next day"
            >
              →
            </button>
          </div>

          {/* Shift Toggle or Closed Notice */}
          <div className="flex items-center justify-center">
            {isClosed ? (
              <div className="px-6 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg border border-gray-300">
                Kitchen Closed
              </div>
            ) : (
              <div className="inline-flex rounded-lg border border-gray-300 bg-white">
                {availableShifts.map((shift: string, index: number) => (
                  <button
                    key={shift}
                    onClick={() => setCurrentShift(shift)}
                    className={`px-6 py-2 text-sm font-medium transition-colors ${
                      index === 0 ? "rounded-l-lg" : ""
                    } ${
                      index === availableShifts.length - 1 ? "rounded-r-lg" : ""
                    } ${
                      currentShift === shift
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {shift}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress */}
          {totalCount > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>
                  {completedCount} of {totalCount} complete
                </span>
                <span>{Math.round((completedCount / totalCount) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Prep Items List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        {isClosed ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">Kitchen is closed on this day</p>
            <p className="text-sm">Select a different date to add prep items</p>
          </div>
        ) : prepItems.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No prep items yet</p>
            <p className="text-sm">Add your first item below</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prepItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-lg shadow-sm p-4 transition-all ${
                  item.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggle(item.id)}
                    className="shrink-0 mt-1"
                    style={{ minWidth: "32px", minHeight: "32px" }}
                  >
                    <div
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${
                        item.completed
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {item.completed && (
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-lg font-medium ${
                        item.completed
                          ? "line-through text-gray-500"
                          : "text-gray-900"
                      }`}
                    >
                      {item.description}
                    </p>
                    {item.quantity_raw && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.quantity_raw}
                      </p>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0 text-red-600 hover:text-red-700 p-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Form - Sticky Bottom */}
      {!isClosed && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <form onSubmit={handleAddItem} className="max-w-3xl mx-auto">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Add prep item..."
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Qty"
                className="w-24 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newItemDescription.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
