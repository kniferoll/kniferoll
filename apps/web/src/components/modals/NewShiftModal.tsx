import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface NewShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (applyToAllDays: boolean) => Promise<void>;
  shiftName: string;
}

/**
 * NewShiftModal - prompts user to choose whether to apply a new shift to all days or none.
 */
export function NewShiftModal({
  isOpen,
  onClose,
  onConfirm,
  shiftName,
}: NewShiftModalProps) {
  const { isDark } = useDarkModeContext();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleChoice = async (applyToAllDays: boolean) => {
    setIsProcessing(true);
    try {
      await onConfirm(applyToAllDays);
      onClose();
    } catch {
      // Error handling done in parent
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <h2
        className={`text-xl font-semibold text-center mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Shift Created
      </h2>

      <p
        className={`text-center text-sm mb-6 ${
          isDark ? "text-slate-400" : "text-gray-500"
        }`}
      >
        Would you like to add <span className="font-medium">"{shiftName}"</span>{" "}
        to all days of the week?
      </p>

      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          onClick={() => handleChoice(true)}
          disabled={isProcessing}
          className="w-full justify-center"
        >
          Add to All Days
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleChoice(false)}
          disabled={isProcessing}
          className="w-full justify-center"
        >
          Don't Add to Any Days
        </Button>
      </div>
    </Modal>
  );
}
