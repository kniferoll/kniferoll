import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib";
import { signInAnonymously } from "@/lib";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { Button, Card, FormInput } from "@/components";
import type { Database } from "@kniferoll/types";

type InviteLink = Database["public"]["Tables"]["invite_links"]["Row"];
type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

/**
 * InviteJoin page - allows users to join a kitchen via invite link
 *
 * Uses the default header from PublicLayout.
 */
export function InviteJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const [inviteLink, setInviteLink] = useState<InviteLink | null>(null);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  // Load invite link on mount
  useEffect(() => {
    const loadInvite = async () => {
      if (!token) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      try {
        const { data: invite, error: inviteError } = await supabase
          .from("invite_links")
          .select("*")
          .eq("token", token)
          .single();

        if (inviteError || !invite) {
          setError("This invite link is not valid");
          setLoading(false);
          return;
        }

        if (new Date(invite.expires_at) < new Date()) {
          setError("This invite has expired. Ask for a new link.");
          setLoading(false);
          return;
        }

        if (invite.revoked) {
          setError("This invite is no longer valid. Ask for a new link.");
          setLoading(false);
          return;
        }

        if (invite.use_count >= invite.max_uses) {
          setError("This invite is no longer valid. Ask for a new link.");
          setLoading(false);
          return;
        }

        setInviteLink(invite);

        const { data: kitchenData } = await supabase
          .from("kitchens")
          .select("*")
          .eq("id", invite.kitchen_id)
          .single();

        setKitchen(kitchenData);
      } catch {
        setError("Failed to validate invite link");
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [token]);

  const handleJoinAsAnonymous = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setJoining(true);

    try {
      if (!inviteLink || !kitchen) {
        throw new Error("Invite link or kitchen not loaded");
      }

      const { user: anonUser, error: authError } = await signInAnonymously();
      if (authError || !anonUser) {
        throw new Error("Failed to sign in anonymously");
      }

      if (displayName) {
        await supabase.auth.updateUser({
          data: { display_name: displayName },
        });
      }

      const { error: memberError } = await supabase
        .from("kitchen_members")
        .insert({
          kitchen_id: kitchen.id,
          user_id: anonUser.id,
          role: "member",
          can_invite: false,
        });

      if (memberError) {
        throw new Error("Failed to join kitchen");
      }

      await supabase
        .from("invite_links")
        .update({ use_count: inviteLink.use_count + 1 })
        .eq("id", inviteLink.id);

      navigate(`/kitchen/${kitchen.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join";
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  // Auto-join if user is already authenticated
  useEffect(() => {
    if (user && inviteLink && kitchen) {
      const handleAutoJoin = async () => {
        try {
          const { data: existingMember } = await supabase
            .from("kitchen_members")
            .select("id")
            .eq("kitchen_id", kitchen.id)
            .eq("user_id", user.id)
            .single();

          if (existingMember) {
            navigate(`/kitchen/${kitchen.id}`);
            return;
          }

          const { error: memberError } = await supabase
            .from("kitchen_members")
            .insert({
              kitchen_id: kitchen.id,
              user_id: user.id,
              role: "member",
              can_invite: false,
            });

          if (memberError) throw memberError;

          await supabase
            .from("invite_links")
            .update({ use_count: inviteLink.use_count + 1 })
            .eq("id", inviteLink.id);

          navigate(`/kitchen/${kitchen.id}`);
        } catch {
          setError("Failed to join kitchen");
        }
      };

      handleAutoJoin();
    }
  }, [user, inviteLink, kitchen, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Loading invite link...
        </p>
      </div>
    );
  }

  // Error state
  if (error && !kitchen) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16">
        <Card padding="lg">
          <h1
            className={`text-2xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Invite Invalid
          </h1>
          <div
            className={`p-3 rounded-lg text-sm mb-6 ${
              isDark
                ? "bg-red-950/50 text-red-400 border border-red-900/50"
                : "bg-red-50 text-red-600 border border-red-100"
            }`}
          >
            {error}
          </div>
          <Button variant="primary" fullWidth onClick={() => navigate("/")}>
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  if (!kitchen || !inviteLink) {
    return null;
  }

  // Auto-joining state (authenticated user)
  if (user) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
        <Card padding="lg">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            Joining {kitchen.name}...
          </p>
        </Card>
      </div>
    );
  }

  // Join form (anonymous user)
  return (
    <div className="w-full max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Join {kitchen.name}
        </h1>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Enter your name to join this kitchen
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleJoinAsAnonymous} className="space-y-5">
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

          <FormInput
            label="Your Name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Chef Alex"
            disabled={joining}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={joining || !displayName.trim()}
          >
            {joining ? "Joining..." : "Join Kitchen"}
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
            Already have an account?
          </p>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
          <p
            className={`mt-4 text-center text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Don't have an account?{" "}
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
