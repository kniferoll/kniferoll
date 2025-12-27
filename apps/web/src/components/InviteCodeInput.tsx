import { useState } from "react";
import {
  validateAndUseInviteCode,
  findKitchenByInviteCode,
} from "../lib/inviteCodeUtils";
import { Button } from "./Button";
import { ErrorAlert } from "./ErrorAlert";

interface InviteCodeInputProps {
  kitchenId?: string;
  onSuccess: (kitchenId?: string) => void;
  onCancel: () => void;
}

export default function InviteCodeInput({
  kitchenId,
  onSuccess,
  onCancel,
}: InviteCodeInputProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    const trimmedCode = code.trim();

    try {
      // If no kitchenId provided, find it from the code
      let finalKitchenId = kitchenId;
      if (!finalKitchenId) {
        const kitchen = await findKitchenByInviteCode(trimmedCode);
        if (!kitchen) {
          setError("Invalid or expired invite code");
          setLoading(false);
          return;
        }
        finalKitchenId = kitchen.kitchenId;
      }

      const result = await validateAndUseInviteCode(
        trimmedCode,
        finalKitchenId
      );

      if (result.valid) {
        onSuccess(finalKitchenId);
      } else {
        setError(result.error || "Invalid invite code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md w-full">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        Join with Invite Code
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Enter the invite code someone shared with you
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorAlert message={error} />}

        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Invite Code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g., ABC12345"
            disabled={loading}
            className="w-full px-4 py-2 text-lg font-mono text-center border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex-1"
          >
            {loading ? "Joining..." : "Join"}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <p className="text-xs text-blue-900 dark:text-blue-200">
          <strong>Tip:</strong> Invite codes are temporary and limited to a
          certain number of uses. If the code doesn't work, ask the person who
          shared it to generate a new one.
        </p>
      </div>
    </div>
  );
}
