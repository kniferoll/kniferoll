import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";

interface ConfirmDeleteStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onHide: () => Promise<void>;
  stationName: string;
}

/**
 * ConfirmDeleteStationModal - warning modal before deleting a station.
 * Warns users that all prep items for this station will be permanently deleted.
 * Offers the option to hide the station instead, which preserves all data.
 */
export function ConfirmDeleteStationModal({
  isOpen,
  onClose,
  onConfirm,
  onHide,
  stationName,
}: ConfirmDeleteStationModalProps) {
  const { isDark } = useDarkModeContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete station");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHide = async () => {
    setError(null);
    setIsHiding(true);

    try {
      await onHide();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to hide station");
    } finally {
      setIsHiding(false);
    }
  };

  const handleClose = () => {
    if (isDeleting || isHiding) return;
    setError(null);
    onClose();
  };

  const isProcessing = isDeleting || isHiding;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <h2
        className={`text-xl font-semibold text-center mb-3 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Delete "{stationName}"?
      </h2>

      <p
        className={`text-center text-sm mb-4 ${
          isDark ? "text-slate-400" : "text-gray-500"
        }`}
      >
        This will permanently delete all prep items for this station.
      </p>

      {/* Hide Instead box */}
      <div
        className={`rounded-lg p-4 mb-4 ${
          isDark
            ? "bg-slate-800 border border-slate-700"
            : "bg-stone-50 border border-stone-200"
        }`}
      >
        <p
          className={`text-sm text-center mb-3 ${
            isDark ? "text-slate-300" : "text-gray-600"
          }`}
        >
          <span className="font-medium">Prefer to keep your data?</span> Hiding
          removes the station from active use but preserves all prep items and
          history. You can unhide it anytime.
        </p>
        <Button
          type="button"
          variant="primary"
          onClick={handleHide}
          className="w-full"
          disabled={isProcessing}
        >
          {isHiding ? "Hiding..." : "Hide Instead"}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-red-500 text-center mb-4">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleClose}
          className="flex-1"
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleConfirm}
          className="flex-1"
          disabled={isProcessing}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Modal>
  );
}
