import { useState } from "react";
import { Button } from "./Button";
import {
  generateCookInviteCode,
  formatTimeRemaining,
} from "../lib/inviteCodeUtils";

interface CookInviteButtonProps {
  kitchenId: string;
  cookSessionUserId: string;
  cookName?: string;
}

export default function CookInviteButton({
  kitchenId,
  cookSessionUserId,
}: CookInviteButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateCode = async () => {
    setLoading(true);
    const result = await generateCookInviteCode(kitchenId, cookSessionUserId, {
      expiryMinutes: 30,
      maxUses: 2,
    });

    if (result) {
      setCode(result.code);
      setExpiresAt(result.expiresAt);
    }
    setLoading(false);
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCode(null);
    setExpiresAt(null);
  };

  return (
    <>
      {/* Button */}
      <Button onClick={() => setIsOpen(true)} variant="secondary">
        📤 Invite
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-sm w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Invite Someone
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {!code ? (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate a temporary invite code to share with others. They
                    can use it to join your kitchen.
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-xs text-blue-900 dark:text-blue-200">
                      <strong>Your code:</strong> Limited to 2 uses, expires in
                      30 minutes
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateCode}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Generating..." : "Generate Code"}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share this code with someone to invite them to join:
                  </p>

                  {/* Code Display */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center">
                    <code className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                      {code}
                    </code>
                  </div>

                  {/* Stats */}
                  {expiresAt && (
                    <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                      <p>Expires in: {formatTimeRemaining(expiresAt)}</p>
                      <p>Max uses: 2</p>
                    </div>
                  )}

                  {/* Copy Button */}
                  <Button
                    onClick={handleCopyCode}
                    variant="secondary"
                    className="w-full"
                  >
                    {copied ? "✓ Copied!" : "📋 Copy Code"}
                  </Button>

                  {/* Info */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <p className="text-xs text-amber-900 dark:text-amber-200">
                      <strong>Note:</strong> This code can only be used 2 times
                      and expires in 30 minutes. Generate a new one if needed.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
              <Button onClick={handleClose} variant="secondary">
                {code ? "Done" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
