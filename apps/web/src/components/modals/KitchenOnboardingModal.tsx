import { useState, useEffect } from "react";
import { useKitchenStore } from "@/stores";
import { usePlanLimits, useStripeCheckout } from "@/hooks";
import { WizardModal } from "./WizardModal";
import {
  StepKitchenName,
  StepOperatingDays,
  StepShifts,
  StepScheduleMode,
  StepStations,
  StepUpgrade,
  type DayOfWeek,
  type ScheduleMode,
  type Schedule,
  DAYS,
  PRESET_SHIFTS,
} from "@/components/kitchen";

type Step =
  | "name"
  | "days"
  | "shifts"
  | "schedule-mode"
  | "stations"
  | "upgrade";

const WIZARD_STEPS = [
  { id: "name", name: "Kitchen Name" },
  { id: "days", name: "Operating Days" },
  { id: "shifts", name: "Shifts" },
  { id: "schedule-mode", name: "Schedule" },
  { id: "stations", name: "Stations" },
];

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
  const { handleCheckout, loading: checkoutLoading } = useStripeCheckout();

  // Form state
  const [step, setStep] = useState<Step>("name");
  const [kitchenName, setKitchenName] = useState("");
  const [closedDays, setClosedDays] = useState<DayOfWeek[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([
    "Lunch",
    "Dinner",
  ]);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("same");
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
  const [error, setError] = useState("");

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep("name");
      setKitchenName("");
      setClosedDays([]);
      setSelectedShifts(["Lunch", "Dinner"]);
      setScheduleMode("same");
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
      setError("");
    }
  }, [isOpen]);

  // Enforce station limit
  useEffect(() => {
    if (limits && limits.maxStationsPerKitchen < Infinity) {
      setStations((prev) =>
        prev.length > limits.maxStationsPerKitchen
          ? prev.slice(0, limits.maxStationsPerKitchen)
          : prev
      );
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
      }
      const newShifts = [...prev, shift];
      const presetInOrder = PRESET_SHIFTS.filter((s) => newShifts.includes(s));
      const custom = newShifts.filter((s) => !PRESET_SHIFTS.includes(s));
      return [...presetInOrder, ...custom];
    });
  };

  const addCustomShift = (shift: string) => {
    if (!selectedShifts.includes(shift)) {
      setSelectedShifts([...selectedShifts, shift]);
    }
  };

  const togglePerDayShift = (day: DayOfWeek, shift: string) => {
    setPerDaySchedule((prev) => ({
      ...prev,
      [day]: prev[day]?.includes(shift)
        ? prev[day].filter((s) => s !== shift)
        : [...(prev[day] || []), shift],
    }));
  };

  const addStation = (station: string) => {
    if (
      limits &&
      limits.maxStationsPerKitchen !== Infinity &&
      stations.length >= limits.maxStationsPerKitchen
    ) {
      setError(
        `Your plan allows up to ${limits.maxStationsPerKitchen} station(s).`
      );
      return;
    }
    if (!stations.includes(station)) {
      setStations([...stations, station]);
      setError("");
    }
  };

  const removeStation = (index: number) => {
    setStations(stations.filter((_, i) => i !== index));
    setError("");
  };

  const handleNext = () => {
    setError("");

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
      // Initialize per-day schedule
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
  };

  const handleBack = () => {
    setError("");
    if (step === "days") setStep("name");
    else if (step === "shifts") setStep("days");
    else if (step === "schedule-mode") setStep("shifts");
    else if (step === "stations") setStep("schedule-mode");
    else if (step === "upgrade") setStep("stations");
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
        `Your plan allows up to ${limits.maxStationsPerKitchen} station(s).`
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

  const renderStep = () => {
    switch (step) {
      case "name":
        return (
          <StepKitchenName
            value={kitchenName}
            onChange={setKitchenName}
            onEnter={handleNext}
          />
        );
      case "days":
        return (
          <StepOperatingDays closedDays={closedDays} onToggleDay={toggleDay} />
        );
      case "shifts":
        return (
          <StepShifts
            selectedShifts={selectedShifts}
            onToggleShift={toggleShift}
            onAddCustomShift={addCustomShift}
            onReorderShifts={setSelectedShifts}
          />
        );
      case "schedule-mode":
        return (
          <StepScheduleMode
            mode={scheduleMode}
            onModeChange={setScheduleMode}
            closedDays={closedDays}
            selectedShifts={selectedShifts}
            perDaySchedule={perDaySchedule}
            onTogglePerDayShift={togglePerDayShift}
          />
        );
      case "stations":
        return (
          <StepStations
            stations={stations}
            onAddStation={addStation}
            onRemoveStation={removeStation}
            maxStations={
              limits?.maxStationsPerKitchen !== Infinity
                ? limits?.maxStationsPerKitchen
                : undefined
            }
            onUpgradeClick={() => setStep("upgrade")}
          />
        );
      case "upgrade":
        return (
          <StepUpgrade
            feature="stations"
            onUpgrade={handleCheckout}
            onSkip={() => setStep("stations")}
            isLoading={checkoutLoading}
          />
        );
    }
  };

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      steps={WIZARD_STEPS}
      currentStepId={step === "upgrade" ? "stations" : step}
      onBack={handleBack}
      onNext={handleNext}
      onSubmit={handleSubmit}
      isFirstStep={step === "name"}
      isLastStep={step === "stations"}
      isLoading={loading}
      submitLabel="Create Kitchen"
      error={error}
      hideNavigation={step === "upgrade"}
    >
      {renderStep()}
    </WizardModal>
  );
}
