import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ConfirmHideStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  stationName: string;
}

/**
 * ConfirmHideStationModal - confirmation modal before hiding a station.
 * Explains that hiding preserves all data and can be undone.
 */
export function ConfirmHideStationModal({
  isOpen,
  onClose,
  onConfirm,
  stationName,
}: ConfirmHideStationModalProps) {
  const { isDark } = useDarkModeContext();
  const [isHiding, setIsHiding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsHiding(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hide station");
    } finally {
      setIsHiding(false);
    }
  };

  const handleClose = () => {
    if (isHiding) return;
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      {/* Info Icon */}
      <div className="flex justify-center mb-4">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            isDark ? "bg-slate-700" : "bg-stone-100"
          }`}
        >
          <svg
            className={`w-8 h-8 ${
              isDark ? "text-slate-300" : "text-stone-600"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        </div>
      </div>

      <h2
        className={`text-xl font-semibold text-center mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Hide "{stationName}"?
      </h2>

      <p
        className={`text-center mb-6 ${
          isDark ? "text-slate-300" : "text-gray-600"
        }`}
      >
        This station will be removed from active use but{" "}
        <span className="font-medium">
          all prep items and historical data will be preserved
        </span>
        . You can unhide it anytime from the settings.
      </p>

      {error && (
        <p className="text-sm text-red-500 text-center mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          className="flex-1"
          disabled={isHiding}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleConfirm}
          className="flex-1"
          disabled={isHiding}
        >
          {isHiding ? "Hiding..." : "Hide Station"}
        </Button>
      </div>
    </Modal>
  );
}
