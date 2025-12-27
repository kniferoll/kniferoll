import { useState } from "react";
import { Button } from "./Button";

interface ShareModalProps {
  kitchenId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/invite?token=YOUR_TOKEN_HERE`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // TODO: Refactor for new invite link system with magic links
  return isOpen ? (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Share Kitchen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Invite system coming soon. Magic links will be used to share your
            kitchen.
          </p>

          <Button onClick={handleCopy} variant="secondary" className="w-full">
            {copied ? "✓ Copied!" : "📋 Copy Invite Link"}
          </Button>

          <Button onClick={onClose} variant="secondary" className="w-full">
            Done
          </Button>
        </div>
      </div>
    </div>
  ) : null;
}
