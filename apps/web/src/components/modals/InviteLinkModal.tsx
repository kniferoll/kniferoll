import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { supabase, captureError } from "@/lib";
import { useDarkModeContext } from "@/context";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { IconBox } from "../ui/IconBox";
import type { Database } from "@kniferoll/types";

type InviteLink = Database["public"]["Tables"]["invite_links"]["Row"];

interface InviteLinkModalProps {
  isOpen: boolean;
  kitchenId: string;
  kitchenName: string;
  onClose: () => void;
}

/**
 * Derive a human-readable 6-character code from the token.
 * Uses first 6 chars of the UUID, uppercased, without hyphens.
 */
function getShortCode(token: string): string {
  return token.replace(/-/g, "").slice(0, 6).toUpperCase();
}

/**
 * InviteLinkModal - modal for creating and sharing invite links.
 *
 * Features:
 * - Generate single-use, 24-hour invite links
 * - QR code for easy scanning
 * - Human-readable short code for manual entry
 * - Copy link to clipboard
 * - Revoke existing links
 */
export function InviteLinkModal({
  isOpen,
  kitchenId,
  kitchenName,
  onClose,
}: InviteLinkModalProps) {
  const { isDark } = useDarkModeContext();
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"link" | "code" | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Get the most recent active link
  const activeLink = inviteLinks.find(
    (link) =>
      !link.revoked &&
      new Date(link.expires_at) > new Date() &&
      link.use_count < link.max_uses
  );

  // Load existing invite links
  useEffect(() => {
    if (isOpen) {
      loadInviteLinks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitchenId, isOpen]);

  // Generate QR code when active link changes
  useEffect(() => {
    if (activeLink && qrCanvasRef.current) {
      const url = `${window.location.origin}/join/${activeLink.token}`;
      QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 100,
        margin: 1,
        color: {
          dark: isDark ? "#ffffff" : "#000000",
          light: isDark ? "#1e293b" : "#ffffff",
        },
      }).catch(() => {
        // Fallback to data URL if canvas fails
        QRCode.toDataURL(url, {
          width: 100,
          margin: 1,
          color: {
            dark: isDark ? "#ffffff" : "#000000",
            light: isDark ? "#1e293b" : "#ffffff",
          },
        })
          .then(setQrCodeUrl)
          .catch((err) => captureError(err, { context: "InviteLinkModal.qrCode" }));
      });
    }
  }, [activeLink, isDark]);

  const loadInviteLinks = async () => {
    try {
      const { data, error: err } = await supabase
        .from("invite_links")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("created_at", { ascending: false })
        .limit(10);

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

  const copyLink = async () => {
    if (!activeLink) return;
    const url = `${window.location.origin}/join/${activeLink.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedType("link");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const copyCode = async () => {
    if (!activeLink) return;
    const code = getShortCode(activeLink.token);
    try {
      await navigator.clipboard.writeText(code);
      setCopiedType("code");
      setTimeout(() => setCopiedType(null), 2000);
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

  const getExpiryText = (link: InviteLink): string => {
    const expiresAt = new Date(link.expires_at);
    const now = new Date();
    const hoursLeft = Math.ceil(
      (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
    );
    if (hoursLeft <= 0) return "Expired";
    if (hoursLeft === 1) return "1 hour left";
    return `${hoursLeft} hours left`;
  };

  const handleClose = () => {
    setError(null);
    setCopiedType(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <IconBox
          size="lg"
          className="bg-linear-to-br from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/30 shrink-0"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </IconBox>
        <div>
          <h2
            className={`text-xl font-semibold cursor-default ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Invite to {kitchenName}
          </h2>
          <p
            className={`text-sm mt-1 cursor-default ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Share a link or code to invite team members
          </p>
        </div>
      </div>

      {error && (
        <div
          className={`p-3 rounded-lg text-sm mb-4 ${
            isDark
              ? "bg-red-950/50 text-red-400 border border-red-900/50"
              : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {error}
        </div>
      )}

      {/* Active invite section */}
      {activeLink ? (
        <div className="space-y-3">
          {/* QR Code and Code side by side */}
          <div
            className={`p-4 rounded-xl border ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-stone-50 border-stone-200"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* QR Code - smaller */}
              <div className="shrink-0">
                <canvas
                  ref={qrCanvasRef}
                  style={{ width: 100, height: 100 }}
                />
                {!qrCanvasRef.current && qrCodeUrl && (
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    style={{ width: 100, height: 100 }}
                  />
                )}
              </div>

              {/* Code */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium mb-1 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Join Code
                </p>
                <p
                  className={`text-2xl font-mono font-bold tracking-wider mb-1 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {getShortCode(activeLink.token)}
                </p>
                <p
                  className={`text-xs ${
                    isDark ? "text-gray-500" : "text-gray-500"
                  }`}
                >
                  Enter at kniferoll.app/join
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={copyCode}
                className="shrink-0"
              >
                {copiedType === "code" ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Full link - compact */}
          <div className="flex items-center gap-2">
            <div
              className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-xs font-mono truncate ${
                isDark
                  ? "bg-slate-800 text-gray-400"
                  : "bg-stone-100 text-gray-600"
              }`}
            >
              {`${window.location.origin}/join/${activeLink.token}`}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyLink}
              className="shrink-0"
            >
              {copiedType === "link" ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          {/* Expiry and actions row */}
          <div className="flex items-center justify-between pt-1">
            <p
              className={`text-xs ${
                isDark ? "text-gray-500" : "text-gray-500"
              }`}
            >
              {getExpiryText(activeLink)} · Single use
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => revokeLink(activeLink.id)}
                className={`text-xs font-medium transition-colors ${
                  isDark
                    ? "text-red-400 hover:text-red-300"
                    : "text-red-600 hover:text-red-700"
                }`}
              >
                Revoke
              </button>
              <button
                onClick={generateInviteLink}
                disabled={generating}
                className={`text-xs font-medium transition-colors ${
                  isDark
                    ? "text-orange-400 hover:text-orange-300"
                    : "text-orange-600 hover:text-orange-700"
                } ${generating ? "opacity-50" : ""}`}
              >
                {generating ? "..." : "New Link"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* No active link - show generate button */
        <div
          className={`p-6 rounded-xl border text-center ${
            isDark
              ? "bg-slate-800/50 border-slate-700 border-dashed"
              : "bg-stone-50 border-stone-200 border-dashed"
          }`}
        >
          <p
            className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Generate a link to invite team members. Links expire in 24 hours and
            are single-use.
          </p>
          <Button
            variant="primary"
            onClick={generateInviteLink}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate Invite Link"}
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end mt-6">
        <Button variant="secondary" onClick={handleClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
