import { useState, useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { useKitchenStore } from "@/stores";
import { usePlanLimits, usePaywall } from "@/hooks";

type Step = "name" | "days" | "shifts" | "schedule-mode" | "stations";
type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
type ScheduleMode = "same" | "varies";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
  { key: "sunday", label: "Sun" },
];

const PRESET_SHIFTS = ["Breakfast", "Lunch", "Dinner"];

const DEFAULT_STATIONS = ["Garde Manger", "Grill", "Sauté", "Pastry", "Prep"];

interface Schedule {
  [key: string]: string[];
}

interface KitchenOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (kitchenId: string) => void;
}

export function KitchenOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: KitchenOnboardingModalProps) {
  const { createKitchen, loading } = useKitchenStore();
  const { limits } = usePlanLimits();
  const { showStationPaywall } = usePaywall();

  const [step, setStep] = useState<Step>("name");
  const [kitchenName, setKitchenName] = useState("");
  const [closedDays, setClosedDays] = useState<DayOfWeek[]>([]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("same");
  const [selectedShifts, setSelectedShifts] = useState<string[]>([
    "Lunch",
    "Dinner",
  ]);
  const [customShift, setCustomShift] = useState("");
  const [perDaySchedule, setPerDaySchedule] = useState<Schedule>({
    monday: ["Lunch", "Dinner"],
    tuesday: ["Lunch", "Dinner"],
    wednesday: ["Lunch", "Dinner"],
    thursday: ["Lunch", "Dinner"],
    friday: ["Lunch", "Dinner"],
    saturday: ["Lunch", "Dinner"],
    sunday: ["Lunch", "Dinner"],
  });
  const [stations, setStations] = useState<string[]>(["Garde Manger"]);
  const [newStation, setNewStation] = useState("");
  const [error, setError] = useState("");
  const [draggedShiftIndex, setDraggedShiftIndex] = useState<number | null>(
    null
  );
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const [touchY, setTouchY] = useState<number>(0);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("name");
      setKitchenName("");
      setClosedDays([]);
      setScheduleMode("same");
      setSelectedShifts(["Lunch", "Dinner"]);
      setCustomShift("");
      setPerDaySchedule({
        monday: ["Lunch", "Dinner"],
        tuesday: ["Lunch", "Dinner"],
        wednesday: ["Lunch", "Dinner"],
        thursday: ["Lunch", "Dinner"],
        friday: ["Lunch", "Dinner"],
        saturday: ["Lunch", "Dinner"],
        sunday: ["Lunch", "Dinner"],
      });
      setStations(["Garde Manger"]);
      setNewStation("");
      setError("");
    }
  }, [isOpen]);

  // Enforce station limit when limits load
  useEffect(() => {
    if (limits && limits.maxStationsPerKitchen < Infinity) {
      setStations((prev) => {
        if (prev.length > limits.maxStationsPerKitchen) {
          return prev.slice(0, limits.maxStationsPerKitchen);
        }
        return prev;
      });
    }
  }, [limits?.maxStationsPerKitchen]);

  const toggleDay = (day: DayOfWeek) => {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleShift = (shift: string) => {
    setSelectedShifts((prev) => {
      if (prev.includes(shift)) {
        return prev.filter((s) => s !== shift);
      } else {
        const newShifts = [...prev, shift];
        const presetInOrder = PRESET_SHIFTS.filter((s) =>
          newShifts.includes(s)
        );
        const custom = newShifts.filter((s) => !PRESET_SHIFTS.includes(s));
        return [...presetInOrder, ...custom];
      }
    });
  };

  const addCustomShift = () => {
    if (customShift.trim() && !selectedShifts.includes(customShift.trim())) {
      setSelectedShifts([...selectedShifts, customShift.trim()]);
      setCustomShift("");
    }
  };

  const togglePerDayShift = (day: DayOfWeek, shift: string) => {
    setPerDaySchedule((prev) => ({
      ...prev,
      [day]: prev[day].includes(shift)
        ? prev[day].filter((s) => s !== shift)
        : [...prev[day], shift],
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedShiftIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedShiftIndex === null) return;

    const newShifts = [...selectedShifts];
    const [draggedItem] = newShifts.splice(draggedShiftIndex, 1);
    newShifts.splice(dropIndex, 0, draggedItem);

    setSelectedShifts(newShifts);
    setDraggedShiftIndex(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setTouchDragIndex(index);
    setTouchY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex === null) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchY;
    const itemHeight = 70;
    const movement = Math.round(diff / itemHeight);

    if (movement !== 0) {
      const newIndex = touchDragIndex + movement;
      if (
        newIndex >= 0 &&
        newIndex < selectedShifts.length &&
        newIndex !== touchDragIndex
      ) {
        const newShifts = [...selectedShifts];
        const [item] = newShifts.splice(touchDragIndex, 1);
        newShifts.splice(newIndex, 0, item);
        setSelectedShifts(newShifts);
        setTouchDragIndex(newIndex);
        setTouchY(currentY);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchDragIndex(null);
  };

  const addStation = () => {
    if (!newStation.trim()) {
      return;
    }

    if (newStation.trim() && !stations.includes(newStation.trim())) {
      if (
        limits &&
        limits.maxStationsPerKitchen !== Infinity &&
        stations.length >= limits.maxStationsPerKitchen
      ) {
        setError(
          `Your plan allows up to ${limits.maxStationsPerKitchen} station${
            limits.maxStationsPerKitchen === 1 ? "" : "s"
          } per kitchen. Upgrade to Pro for unlimited stations.`
        );
        return;
      }

      setStations([...stations, newStation.trim()]);
      setNewStation("");
      setError("");
    }
  };

  const removeStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
    setError("");
  };

  const handleNext = () => {
    if (step === "name") {
      if (!kitchenName.trim()) {
        setError("Please enter a kitchen name");
        return;
      }
      setStep("days");
    } else if (step === "days") {
      setStep("shifts");
    } else if (step === "shifts") {
      if (selectedShifts.length === 0) {
        setError("Please select at least one shift");
        return;
      }
      const newSchedule: Schedule = {};
      DAYS.forEach(({ key }) => {
        if (!closedDays.includes(key)) {
          newSchedule[key] = [...selectedShifts];
        }
      });
      setPerDaySchedule(newSchedule);
      setStep("schedule-mode");
    } else if (step === "schedule-mode") {
      setStep("stations");
    }
    setError("");
  };

  const handleBack = () => {
    if (step === "days") setStep("name");
    else if (step === "shifts") setStep("days");
    else if (step === "schedule-mode") setStep("shifts");
    else if (step === "stations") setStep("schedule-mode");
    setError("");
  };

  const handleSubmit = async () => {
    setError("");

    if (stations.length === 0) {
      setError("Add at least one station");
      return;
    }

    if (
      limits &&
      limits.maxStationsPerKitchen !== Infinity &&
      stations.length > limits.maxStationsPerKitchen
    ) {
      setError(
        `Your plan allows up to ${limits.maxStationsPerKitchen} station${
          limits.maxStationsPerKitchen === 1 ? "" : "s"
        } per kitchen. Please remove some stations.`
      );
      return;
    }

    const result = await createKitchen(
      kitchenName,
      stations,
      closedDays,
      perDaySchedule
    );

    if (result.error) {
      setError(result.error);
    } else if (result.kitchenId) {
      onSuccess(result.kitchenId);
    }
  };

  const steps = [
    {
      id: "name" as Step,
      name: "Kitchen Name",
      description: "Name your kitchen",
    },
    {
      id: "days" as Step,
      name: "Operating Days",
      description: "Select open days",
    },
    { id: "shifts" as Step, name: "Shifts", description: "Configure shifts" },
    {
      id: "schedule-mode" as Step,
      name: "Schedule",
      description: "Set schedule mode",
    },
    { id: "stations" as Step, name: "Stations", description: "Add stations" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const progress = {
    name: 20,
    days: 40,
    shifts: 60,
    "schedule-mode": 80,
    stations: 100,
  }[step];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl flex gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step Indicator Sidebar */}
        <nav
          aria-label="Progress"
          className="hidden md:flex flex-col justify-center"
        >
          <ol role="list" className="space-y-6">
            {steps.map((s, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <li key={s.id}>
                  {isComplete ? (
                    <div className="group flex items-start">
                      <span className="relative flex size-5 shrink-0 items-center justify-center">
                        <CheckCircleIcon
                          aria-hidden="true"
                          className="size-full text-blue-500 dark:text-blue-400"
                        />
                      </span>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {s.name}
                      </span>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex items-start" aria-current="step">
                      <span
                        aria-hidden="true"
                        className="relative flex size-5 shrink-0 items-center justify-center"
                      >
                        <span className="absolute size-4 rounded-full bg-blue-200 dark:bg-blue-900" />
                        <span className="relative block size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                      </span>
                      <span className="ml-3 text-sm font-medium text-blue-600 dark:text-blue-400">
                        {s.name}
                      </span>
                    </div>
                  ) : (
                    <div className="group flex items-start">
                      <div
                        aria-hidden="true"
                        className="relative flex size-5 shrink-0 items-center justify-center"
                      >
                        <div className="size-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                      </div>
                      <p className="ml-3 text-sm font-medium text-gray-400 dark:text-gray-500">
                        {s.name}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Progress Bar */}
          <div className="mb-6 md:hidden">
            <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-700 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-8 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm text-red-600 dark:text-red-400 border border-red-500/30 p-3 rounded-md text-sm mb-6">
                {error}
              </div>
            )}

            {/* Step 1: Kitchen Name */}
            {step === "name" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                  Name your kitchen
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  What should we call this kitchen?
                </p>
                <input
                  type="text"
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="e.g., Blue Duck Tavern"
                  autoFocus
                />
              </div>
            )}

            {/* Step 2: Days Open */}
            {step === "days" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                  Which days are you open?
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Tap any day to toggle closed
                </p>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS.map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => toggleDay(key)}
                      className={`py-4 rounded-lg font-semibold text-sm transition-all ${
                        closedDays.includes(key)
                          ? "bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-400 line-through"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Shifts */}
            {step === "shifts" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                  Which shifts do you run?
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Select your shifts, then reorder them below
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  {PRESET_SHIFTS.map((shift) => (
                    <button
                      key={shift}
                      onClick={() => toggleShift(shift)}
                      className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all ${
                        selectedShifts.includes(shift)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      {selectedShifts.includes(shift) && "✓ "}
                      {shift}
                    </button>
                  ))}
                </div>

                {selectedShifts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-700 dark:text-slate-300 font-medium mb-3">
                      Your shifts (drag to reorder):
                    </p>
                    <div className="space-y-2">
                      {selectedShifts.map((shift, index) => (
                        <div
                          key={shift}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          onTouchStart={(e) => handleTouchStart(e, index)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          className={`flex items-center gap-3 bg-blue-50 dark:bg-slate-800 border-2 rounded-lg p-4 cursor-move touch-none transition-all ${
                            draggedShiftIndex === index ||
                            touchDragIndex === index
                              ? "opacity-50 border-blue-400 scale-105"
                              : "border-blue-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-slate-500 hover:shadow-md"
                          }`}
                        >
                          <div className="text-gray-400 dark:text-slate-500">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                            </svg>
                          </div>

                          <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold text-sm">
                            {index + 1}
                          </div>

                          <div className="flex-1 font-semibold text-gray-900 dark:text-slate-100 text-lg">
                            {shift}
                          </div>

                          <button
                            onClick={() => toggleShift(shift)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <input
                    type="text"
                    value={customShift}
                    onChange={(e) => setCustomShift(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addCustomShift())
                    }
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    placeholder="Add custom shift (e.g., Brunch, Late Night)"
                  />
                  <button
                    onClick={addCustomShift}
                    className="px-6 py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg font-medium text-gray-900 dark:text-slate-100 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Schedule Mode */}
            {step === "schedule-mode" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                  Different shifts on different days?
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Most kitchens have the same shifts every day
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => setScheduleMode("same")}
                    className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                      scheduleMode === "same"
                        ? "border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-600"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                          Same every day
                        </div>
                        <div className="text-gray-600 dark:text-slate-400 mt-1">
                          {selectedShifts.join(", ")} on all open days
                        </div>
                      </div>
                      {scheduleMode === "same" && (
                        <div className="text-blue-600 dark:text-blue-400 text-2xl">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => setScheduleMode("varies")}
                    className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                      scheduleMode === "varies"
                        ? "border-blue-500 bg-blue-50 dark:bg-slate-800 dark:border-blue-600"
                        : "border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-lg text-gray-900 dark:text-slate-100">
                          Varies by day
                        </div>
                        <div className="text-gray-600 dark:text-slate-400 mt-1">
                          Configure each day separately
                        </div>
                      </div>
                      {scheduleMode === "varies" && (
                        <div className="text-blue-600 dark:text-blue-400 text-2xl">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                {scheduleMode === "varies" && (
                  <div className="border-t dark:border-slate-700 pt-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">
                      Configure each day:
                    </h3>
                    {DAYS.map(({ key, label }) => {
                      if (closedDays.includes(key)) {
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between py-2"
                          >
                            <span className="font-medium text-gray-400 dark:text-slate-500 w-24">
                              {label}
                            </span>
                            <span className="text-gray-400 dark:text-slate-500 italic">
                              Closed
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="flex items-start gap-3">
                          <span className="font-medium text-gray-900 dark:text-slate-100 w-24 pt-2">
                            {label}
                          </span>
                          <div className="flex-1 flex flex-wrap gap-2">
                            {selectedShifts.map((shift) => (
                              <button
                                key={shift}
                                onClick={() => togglePerDayShift(key, shift)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                  perDaySchedule[key]?.includes(shift)
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                                }`}
                              >
                                {perDaySchedule[key]?.includes(shift) && "✓ "}
                                {shift}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Stations */}
            {step === "stations" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mb-2">
                  Add your stations
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mb-6">
                  Where does the work get done?
                </p>

                {stations.length > 0 && (
                  <div className="mb-6 space-y-2">
                    {stations.map((station, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg"
                      >
                        <span className="font-medium text-gray-900 dark:text-slate-100">
                          {station}
                        </span>
                        <button
                          onClick={() => removeStation(index)}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 font-semibold transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-8 flex gap-2">
                  <input
                    type="text"
                    value={newStation}
                    onChange={(e) => setNewStation(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addStation())
                    }
                    disabled={
                      !!(
                        limits &&
                        limits.maxStationsPerKitchen !== Infinity &&
                        stations.length >= limits.maxStationsPerKitchen
                      )
                    }
                    className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 placeholder-gray-500 dark:placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Add station..."
                  />
                  <button
                    onClick={addStation}
                    disabled={
                      !!(
                        limits &&
                        limits.maxStationsPerKitchen !== Infinity &&
                        stations.length >= limits.maxStationsPerKitchen
                      )
                    }
                    className="px-6 py-3 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-900 dark:text-slate-100 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add
                  </button>
                </div>

                {limits &&
                  limits.maxStationsPerKitchen !== Infinity &&
                  stations.length >= limits.maxStationsPerKitchen && (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-gray-300 dark:bg-slate-600"></div>
                      </div>

                      <div className="mb-6 space-y-2 opacity-60">
                        {DEFAULT_STATIONS.filter(
                          (station) => !stations.includes(station)
                        ).map((station) => (
                          <div
                            key={station}
                            className="flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-600 dark:text-slate-400"
                          >
                            <span className="font-medium">{station}</span>
                            <span className="text-xl">🔒</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => showStationPaywall()}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-sm"
                      >
                        Need more stations? Pro has unlimited →
                      </button>
                    </>
                  )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {step !== "name" && (
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg font-semibold text-gray-900 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
              )}

              {step !== "stations" ? (
                <button
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Kitchen"}
                </button>
              )}
            </div>

            {/* Exit Button */}
            <div className="mt-4 text-center">
              <button
                onClick={onClose}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium text-sm transition-colors"
              >
                Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
