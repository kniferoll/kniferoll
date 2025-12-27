import { useEffect, useState } from "react";
import { Button } from "./Button";
import {
  generateChefInviteCode,
  getActiveInviteCodesForKitchen,
  deactivateInviteCode,
  deleteInviteCode,
  formatTimeRemaining,
  isExpired,
  type InviteCode,
} from "../lib/inviteCodeUtils";

interface ShareModalProps {
  kitchenId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  kitchenId,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Load active codes on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCodes();
    }
  }, [isOpen]);

  const loadCodes = async () => {
    setLoading(true);
    const activeCodes = await getActiveInviteCodesForKitchen(kitchenId);
    setCodes(activeCodes);
    setLoading(false);
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    const result = await generateChefInviteCode(kitchenId, {
      expiryMinutes: 60,
      maxUses: 5,
    });

    if (result) {
      // Reload codes to show the new one
      await loadCodes();
    }
    setGeneratingCode(false);
  };

  const handleCopyCode = (code: string, codeId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(codeId);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDeactivateCode = async (codeId: string) => {
    if (confirm("Are you sure you want to deactivate this code?")) {
      const success = await deactivateInviteCode(codeId);
      if (success) {
        setCodes(codes.filter((c) => c.id !== codeId));
      }
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (confirm("Are you sure you want to delete this code?")) {
      const success = await deleteInviteCode(codeId);
      if (success) {
        setCodes(codes.filter((c) => c.id !== codeId));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Share Kitchen
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Generate New Code Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Generate New Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a shareable code for cooks to join. Default: 60 minutes, 5
              uses.
            </p>
            <Button
              onClick={handleGenerateCode}
              disabled={generatingCode}
              className="w-full"
            >
              {generatingCode ? "Generating..." : "Generate Code"}
            </Button>
          </div>

          {/* Active Codes List */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Active Codes ({codes.length})
            </h3>

            {loading ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                Loading codes...
              </div>
            ) : codes.length === 0 ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No active codes. Generate one to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                  >
                    {/* Code Display */}
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                        {code.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(code.code, code.id)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors text-lg"
                        title="Copy code"
                      >
                        {copiedCodeId === code.id ? "✓" : "📋"}
                      </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Uses:
                        </span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                          {code.current_uses}/{code.max_uses}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Expires:
                        </span>
                        <span
                          className={`ml-1 font-semibold ${
                            isExpired(code.expires_at)
                              ? "text-red-600"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {formatTimeRemaining(code.expires_at)}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-3">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                        style={{
                          width: `${
                            (code.current_uses / code.max_uses) * 100
                          }%`,
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeactivateCode(code.id)}
                        className="flex-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
                      >
                        Deactivate
                      </button>
                      <button
                        onClick={() => handleDeleteCode(code.id)}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors text-lg"
                        title="Delete code"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Tip:</strong> Share the code with cooks. Once they use it,
              they'll be added to your kitchen. Codes automatically deactivate
              when they reach their use limit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
