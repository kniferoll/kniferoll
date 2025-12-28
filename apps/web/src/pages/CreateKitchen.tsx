import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchenStore } from "../stores/kitchenStore";
import { usePlanLimits } from "../hooks/usePlanLimits";
import { CenteredPage } from "../components/CenteredPage";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DEFAULT_SHIFTS = ["Breakfast", "Lunch", "Dinner"];
const DEFAULT_STATIONS = ["Garde Manger", "Sauté", "Grill", "Pastry", "Prep"];

type Shift = {
  name: string;
  isCustom: boolean;
};

type ShiftConfig = {
  [day: string]: Shift[];
};

export function CreateKitchen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createKitchen } = useKitchenStore();
  const { limits } = usePlanLimits();
  const [step, setStep] = useState(1);
  const [kitchenName, setKitchenName] = useState("");
  const [openDays, setOpenDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [shifts, setShifts] = useState<Shift[]>(
    DEFAULT_SHIFTS.map((s) => ({ name: s, isCustom: false }))
  );
  const [customShiftInput, setCustomShiftInput] = useState("");
  const [customizeByDay, setCustomizeByDay] = useState(false);
  const [shiftsByDay, setShiftsByDay] = useState<ShiftConfig>({});
  const [stations, setStations] = useState<string[]>(() => {
    // Initialize with default stations, but will be limited by plan
    return DEFAULT_STATIONS;
  });
  const [customStationInput, setCustomStationInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize shifts by day when shifting to day customization
  useEffect(() => {
    if (customizeByDay && Object.keys(shiftsByDay).length === 0) {
      const config: ShiftConfig = {};
      openDays.forEach((day) => {
        config[day] = shifts;
      });
      setShiftsByDay(config);
    }
  }, [customizeByDay, openDays, shifts, shiftsByDay]);

  // Enforce station limit based on plan
  useEffect(() => {
    if (limits && limits.maxStationsPerKitchen !== Infinity) {
      setStations((prevStations) => {
        if (prevStations.length > limits.maxStationsPerKitchen) {
          return prevStations.slice(0, limits.maxStationsPerKitchen);
        }
        return prevStations;
      });
    }
  }, [limits]);

  if (!user) {
    return (
      <CenteredPage>
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Please sign in to create a kitchen</p>
        </div>
      </CenteredPage>
    );
  }

  const handleAddCustomShift = () => {
    if (customShiftInput.trim()) {
      const newShift: Shift = { name: customShiftInput.trim(), isCustom: true };
      setShifts([...shifts, newShift]);
      setCustomShiftInput("");
    }
  };

  const handleRemoveShift = (index: number) => {
    setShifts(shifts.filter((_, i) => i !== index));
  };

  const handleToggleDayShift = (day: string, shiftName: string) => {
    const dayShifts = shiftsByDay[day] || [];
    if (dayShifts.some((s) => s.name === shiftName)) {
      setShiftsByDay({
        ...shiftsByDay,
        [day]: dayShifts.filter((s) => s.name !== shiftName),
      });
    } else {
      const shift = shifts.find((s) => s.name === shiftName) || {
        name: shiftName,
        isCustom: true,
      };
      setShiftsByDay({
        ...shiftsByDay,
        [day]: [...dayShifts, shift],
      });
    }
  };

  const handleAddStation = () => {
    if (!customStationInput.trim()) {
      return;
    }

    // Check station limit
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

    setStations([...stations, customStationInput.trim()]);
    setCustomStationInput("");
    setError("");
  };

  const handleRemoveStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
    setError("");
  };

  const handleCreateKitchen = async () => {
    if (!kitchenName.trim()) {
      setError("Kitchen name is required");
      return;
    }

    if (stations.length === 0) {
      setError("At least one station is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { kitchenId, error: createError } = await createKitchen(
        kitchenName,
        stations
      );

      if (createError) {
        setError(createError);
        setLoading(false);
        return;
      }

      if (!kitchenId) {
        setError("Failed to create kitchen");
        setLoading(false);
        return;
      }

      // TODO: Save schedule configuration (shifts, days, custom day shifts)
      // This would require additional kitchen config table/fields

      navigate(`/kitchen/${kitchenId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create kitchen";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <CenteredPage>
      <div className="w-full max-w-2xl">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    s <= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Step {step} of 5
            </div>
          </div>

          {error && <ErrorAlert title="Error" message={error} />}

          {/* Step 1: Kitchen Name */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                What's your kitchen called?
              </h2>
              <input
                type="text"
                value={kitchenName}
                onChange={(e) => setKitchenName(e.target.value)}
                placeholder="e.g., The French Laundry"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white text-lg mb-6"
              />
            </div>
          )}

          {/* Step 2: Days Open */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Which days are you open?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => {
                      if (openDays.includes(day)) {
                        setOpenDays(openDays.filter((d) => d !== day));
                      } else {
                        setOpenDays([...openDays, day]);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      openDays.includes(day)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Shifts */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                What shifts do you run?
              </h2>
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {shifts.map((shift, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 rounded-full"
                    >
                      {shift.name}
                      <button
                        onClick={() => handleRemoveShift(index)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customShiftInput}
                    onChange={(e) => setCustomShiftInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomShift();
                      }
                    }}
                    placeholder="Add custom shift (e.g., Brunch)"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  />
                  <button
                    onClick={handleAddCustomShift}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="border-t pt-6 dark:border-gray-600">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!customizeByDay}
                    onChange={(e) => setCustomizeByDay(!e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Same shifts every day
                  </span>
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {customizeByDay
                    ? "You can customize shifts for specific days below"
                    : "All open days will have these shifts"}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Custom Day Shifts (if enabled) */}
          {step === 4 && customizeByDay && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Customize shifts by day
              </h2>
              <div className="space-y-6">
                {openDays.map((day) => (
                  <div
                    key={day}
                    className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {day}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {shifts.map((shift) => (
                        <button
                          key={shift.name}
                          onClick={() => handleToggleDayShift(day, shift.name)}
                          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            (shiftsByDay[day] || []).some(
                              (s) => s.name === shift.name
                            )
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {shift.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Stations */}
          {((step === 4 && !customizeByDay) || step === 5) && (
            <div>
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  What stations does your kitchen have?
                </h2>
                {limits && limits.maxStationsPerKitchen !== Infinity && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your plan allows up to {limits.maxStationsPerKitchen}{" "}
                    station
                    {limits.maxStationsPerKitchen === 1 ? "" : "s"} per kitchen.{" "}
                    {limits.maxStationsPerKitchen === 1 && (
                      <span>
                        <a
                          href="/upgrade"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Upgrade to Pro
                        </a>{" "}
                        for unlimited stations.
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-3 mb-6">
                {stations.map((station, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white">
                      {station}
                    </span>
                    <button
                      onClick={() => handleRemoveStation(index)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStationInput}
                  onChange={(e) => setCustomStationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStation();
                    }
                  }}
                  placeholder="Add station name"
                  disabled={
                    !!(
                      limits &&
                      limits.maxStationsPerKitchen !== Infinity &&
                      stations.length >= limits.maxStationsPerKitchen
                    )
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-slate-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleAddStation}
                  disabled={
                    !!(
                      limits &&
                      limits.maxStationsPerKitchen !== Infinity &&
                      stations.length >= limits.maxStationsPerKitchen
                    )
                  }
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 5 || (step === 5 && !customizeByDay && step < 4) ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && !kitchenName.trim()) {
                    setError("Kitchen name is required");
                    return;
                  }
                  if (step === 2 && openDays.length === 0) {
                    setError("Select at least one day");
                    return;
                  }
                  if (step === 3 && shifts.length === 0) {
                    setError("Add at least one shift");
                    return;
                  }
                  setError("");
                  setStep(step + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleCreateKitchen}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Kitchen"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </CenteredPage>
  );
}
