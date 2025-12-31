import { useState, useEffect } from "react";
import { supabase } from "@/lib";
import { Button } from "@/components/ui/Button";
import type { Database } from "@kniferoll/types";

type InviteLink = Database["public"]["Tables"]["invite_links"]["Row"];

interface InviteLinkModalProps {
  kitchenId: string;
  kitchenName: string;
  onClose: () => void;
}

export function InviteLinkModal({
  kitchenId,
  kitchenName,
  onClose,
}: InviteLinkModalProps) {
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Load existing invite links
  useEffect(() => {
    loadInviteLinks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenId]);

  const loadInviteLinks = async () => {
    try {
      const { data, error: err } = await supabase
        .from("invite_links")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setInviteLinks(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load links";
      setError(message);
    }
  };

  const generateInviteLink = async () => {
    setGenerating(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Generate random token
      const token = crypto.randomUUID();

      // Create invite link with 24 hour expiry
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data: newLink, error: err } = await supabase
        .from("invite_links")
        .insert({
          kitchen_id: kitchenId,
          token,
          expires_at: expiresAt.toISOString(),
          max_uses: 1,
          created_by_user: user.id,
        })
        .select()
        .single();

      if (err || !newLink) throw err || new Error("Failed to create link");

      setInviteLinks([newLink, ...inviteLinks]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate link";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (link: InviteLink) => {
    const url = `${window.location.origin}/join/${link.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const revokeLink = async (linkId: string) => {
    try {
      const { error: err } = await supabase
        .from("invite_links")
        .update({ revoked: true })
        .eq("id", linkId);

      if (err) throw err;
      setInviteLinks(
        inviteLinks.map((l) => (l.id === linkId ? { ...l, revoked: true } : l))
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to revoke link";
      setError(message);
    }
  };

  const isLinkExpired = (link: InviteLink): boolean => {
    return new Date(link.expires_at) < new Date() || link.revoked;
  };

  const isLinkMaxedOut = (link: InviteLink): boolean => {
    return link.use_count >= link.max_uses;
  };

  const getInviteUrl = (token: string) => {
    return `${window.location.origin}/join/${token}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invite to {kitchenName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-bold text-2xl"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Generate new link button */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Create a new invite link to share with team members. Links expire
              in 24 hours and are single-use.
            </p>
            <Button
              onClick={generateInviteLink}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {generating ? "Creating..." : "Generate New Link"}
            </Button>
          </div>

          {/* Existing links */}
          {inviteLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Links ({inviteLinks.length})
              </h3>
              <div className="space-y-2">
                {inviteLinks.map((link) => {
                  const expired = isLinkExpired(link);
                  const maxedOut = isLinkMaxedOut(link);
                  const url = getInviteUrl(link.token);
                  const expiresIn = Math.ceil(
                    (new Date(link.expires_at).getTime() -
                      new Date().getTime()) /
                      (1000 * 60 * 60)
                  );

                  return (
                    <div
                      key={link.id}
                      className={`p-4 border rounded-lg ${
                        expired || maxedOut
                          ? "bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-gray-600 opacity-60"
                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-mono break-all text-gray-600 dark:text-gray-400">
                              {url}
                            </p>
                            {copiedLinkId === link.id && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                                Copied!
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {expired ? "Expired" : `Expires in ${expiresIn}h`}
                            </span>
                            <span>
                              {link.use_count}/{link.max_uses} uses
                            </span>
                            {link.revoked && (
                              <span className="text-red-600">Revoked</span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {!expired && !maxedOut && !link.revoked && (
                            <button
                              onClick={() => copyToClipboard(link)}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            >
                              Copy
                            </button>
                          )}

                          {!link.revoked && (
                            <button
                              onClick={() => revokeLink(link.id)}
                              className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {inviteLinks.length === 0 && !generating && (
            <p className="text-center text-gray-600 dark:text-gray-400">
              No invite links yet. Create one to get started!
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
