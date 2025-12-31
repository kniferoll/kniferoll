import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * AddStationModal - modal for creating a new station.
 */
export function AddStationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddStationModalProps) {
  const { isDark } = useDarkModeContext();
  const [stationName, setStationName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = stationName.trim();
    if (!trimmedName) {
      setError("Station name is required");
      return;
    }

    try {
      await onSubmit(trimmedName);
      setStationName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create station");
    }
  };

  const handleClose = () => {
    setStationName("");
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <h2
        className={`text-xl font-semibold mb-4 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Add New Station
      </h2>

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Station Name"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
          placeholder="e.g., Garde Manger, Grill, Prep..."
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={isLoading || !stationName.trim()}
          >
            {isLoading ? "Creating..." : "Create Station"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
