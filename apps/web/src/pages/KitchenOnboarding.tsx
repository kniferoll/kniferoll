import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKitchenStore } from "../stores/kitchenStore";

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
const DEFAULT_STATIONS = ["Salads", "Grill", "Sauté", "Pantry", "Desserts"];

interface Schedule {
  [key: string]: string[];
}

export function KitchenOnboarding() {
  const navigate = useNavigate();
  const { createKitchen, loading } = useKitchenStore();

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
  const [stations, setStations] = useState<string[]>(DEFAULT_STATIONS);
  const [newStation, setNewStation] = useState("");
  const [error, setError] = useState("");

  const toggleDay = (day: DayOfWeek) => {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleShift = (shift: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shift) ? prev.filter((s) => s !== shift) : [...prev, shift]
    );
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

  const addStation = () => {
    if (newStation.trim() && !stations.includes(newStation.trim())) {
      setStations([...stations, newStation.trim()]);
      setNewStation("");
    }
  };

  const removeStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
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
      // Initialize per-day schedule with selected shifts
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

    // Build schedule object
    const schedule: Schedule =
      scheduleMode === "same" ? { default: selectedShifts } : perDaySchedule;

    const result = await createKitchen(
      kitchenName,
      stations,
      schedule,
      closedDays
    );

    if (result.error) {
      setError(result.error);
    } else if (result.kitchenId) {
      navigate("/dashboard");
    }
  };

  const progress = {
    name: 20,
    days: 40,
    shifts: 60,
    "schedule-mode": 80,
    stations: 100,
  }[step];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Kitchen Name */}
          {step === "name" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Name your kitchen
              </h2>
              <p className="text-gray-600 mb-6">
                What should we call this kitchen?
              </p>
              <input
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Blue Duck Tavern"
                autoFocus
              />
            </div>
          )}

          {/* Step 2: Days Open */}
          {step === "days" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Which days are you open?
              </h2>
              <p className="text-gray-600 mb-6">Tap any day to toggle closed</p>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleDay(key)}
                    className={`py-4 rounded-lg font-semibold text-sm transition-all ${
                      closedDays.includes(key)
                        ? "bg-gray-100 text-gray-400 line-through"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Which shifts do you run?
              </h2>
              <p className="text-gray-600 mb-6">Select your standard shifts</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {PRESET_SHIFTS.map((shift) => (
                  <button
                    key={shift}
                    onClick={() => toggleShift(shift)}
                    className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all ${
                      selectedShifts.includes(shift)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {selectedShifts.includes(shift) && "✓ "}
                    {shift}
                  </button>
                ))}
              </div>

              {/* Custom shifts */}
              <div className="space-y-2">
                {selectedShifts
                  .filter((s) => !PRESET_SHIFTS.includes(s))
                  .map((shift) => (
                    <div key={shift} className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg font-medium">
                        {shift}
                      </div>
                      <button
                        onClick={() => toggleShift(shift)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>

              <div className="flex gap-2 mt-4">
                <input
                  type="text"
                  value={customShift}
                  onChange={(e) => setCustomShift(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addCustomShift())
                  }
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add custom shift (e.g., Brunch, Late Night)"
                />
                <button
                  onClick={addCustomShift}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Schedule Mode */}
          {step === "schedule-mode" && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Different shifts on different days?
              </h2>
              <p className="text-gray-600 mb-6">
                Most kitchens have the same shifts every day
              </p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setScheduleMode("same")}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                    scheduleMode === "same"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        Same every day
                      </div>
                      <div className="text-gray-600 mt-1">
                        {selectedShifts.join(", ")} on all open days
                      </div>
                    </div>
                    {scheduleMode === "same" && (
                      <div className="text-blue-600 text-2xl">✓</div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setScheduleMode("varies")}
                  className={`w-full p-6 rounded-lg border-2 transition-all text-left ${
                    scheduleMode === "varies"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg text-gray-900">
                        Varies by day
                      </div>
                      <div className="text-gray-600 mt-1">
                        Configure each day separately
                      </div>
                    </div>
                    {scheduleMode === "varies" && (
                      <div className="text-blue-600 text-2xl">✓</div>
                    )}
                  </div>
                </button>
              </div>

              {/* Per-day configuration */}
              {scheduleMode === "varies" && (
                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Configure each day:
                  </h3>
                  {DAYS.map(({ key, label }) => {
                    if (closedDays.includes(key)) {
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="font-medium text-gray-400 w-24">
                            {label}
                          </span>
                          <span className="text-gray-400 italic">Closed</span>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="flex items-start gap-3">
                        <span className="font-medium text-gray-900 w-24 pt-2">
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
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Add your stations
              </h2>
              <p className="text-gray-600 mb-6">
                Where does the work get done?
              </p>

              <div className="space-y-2 mb-4">
                {stations.map((station, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-medium">
                      {station}
                    </div>
                    <button
                      onClick={() => removeStation(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addStation())
                  }
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add station..."
                />
                <button
                  onClick={addStation}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  + Add
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step !== "name" && (
              <button
                onClick={handleBack}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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
        </div>
      </div>
    </div>
  );
}
