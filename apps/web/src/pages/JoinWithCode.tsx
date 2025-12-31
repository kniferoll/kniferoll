import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib";
import { useDarkModeContext } from "@/context";
import { Button, Card } from "@/components";

/**
 * JoinWithCode page - allows users to enter a short code to join a kitchen
 *
 * The short code is the first 6 characters of the invite token (uppercased, no hyphens).
 * This page searches for tokens that start with this prefix.
 */
export function JoinWithCode() {
  const navigate = useNavigate();
  const { isDark } = useDarkModeContext();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Normalize code: uppercase, remove spaces/hyphens
      const normalizedCode = code.replace(/[\s-]/g, "").toUpperCase();

      if (normalizedCode.length < 6) {
        setError("Please enter a 6-character code");
        setLoading(false);
        return;
      }

      // Search for tokens that start with this code (case-insensitive)
      // We need to search in lowercase since UUIDs are lowercase
      const searchPrefix = normalizedCode.toLowerCase();

      const { data: invites, error: searchError } = await supabase
        .from("invite_links")
        .select("token, expires_at, revoked, use_count, max_uses")
        .ilike("token", `${searchPrefix}%`)
        .eq("revoked", false)
        .limit(10);

      if (searchError) {
        throw new Error("Failed to search for invite code");
      }

      // Find a valid invite
      const validInvite = invites?.find((invite) => {
        const notExpired = new Date(invite.expires_at) > new Date();
        const hasUses = invite.use_count < invite.max_uses;
        return notExpired && hasUses;
      });

      if (!validInvite) {
        setError("Invalid or expired code. Please check and try again.");
        setLoading(false);
        return;
      }

      // Redirect to the full invite join page
      navigate(`/join/${validInvite.token}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  // Format code input: uppercase and add visual spacing
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    setCode(value);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Join a Kitchen
        </h1>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Enter the 6-character code from your invite
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div
              className={`p-3 rounded-lg text-sm ${
                isDark
                  ? "bg-red-950/50 text-red-400 border border-red-900/50"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDark ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Join Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              disabled={loading}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={`
                w-full px-4 py-4 text-center text-3xl font-mono font-bold tracking-[0.3em]
                rounded-xl border transition-colors
                ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-gray-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    : "bg-white border-stone-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                }
              `}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={loading || code.length < 6}
          >
            {loading ? "Finding kitchen..." : "Join Kitchen"}
          </Button>
        </form>

        <div
          className={`mt-6 pt-6 border-t ${
            isDark ? "border-slate-700" : "border-stone-200"
          }`}
        >
          <p
            className={`text-center text-sm mb-4 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Have a full link instead?
          </p>
          <p
            className={`text-center text-sm ${
              isDark ? "text-gray-500" : "text-gray-500"
            }`}
          >
            Just paste it in your browser's address bar
          </p>
        </div>

        <div
          className={`mt-6 pt-6 border-t ${
            isDark ? "border-slate-700" : "border-stone-200"
          }`}
        >
          <p
            className={`text-center text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Want to create your own kitchen?{" "}
            <Link
              to="/signup"
              className="text-orange-500 hover:text-orange-600 font-semibold"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
