import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { signInAnonymously } from "../lib/auth";
import { useAuthStore } from "../stores/authStore";
import { CenteredPage } from "../components/CenteredPage";
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";
import type { Database } from "@kniferoll/types";

type InviteLink = Database["public"]["Tables"]["invite_links"]["Row"];
type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

export function InviteJoin() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

        // Check if link is expired
        if (new Date(invite.expires_at) < new Date()) {
          setError("This invite has expired. Ask for a new link.");
          setLoading(false);
          return;
        }

        // Check if link is revoked
        if (invite.revoked) {
          setError("This invite is no longer valid. Ask for a new link.");
          setLoading(false);
          return;
        }

        // Check if max uses reached
        if (invite.use_count >= invite.max_uses) {
          setError("This invite is no longer valid. Ask for a new link.");
          setLoading(false);
          return;
        }

        setInviteLink(invite);

        // Load kitchen details
        const { data: kitchenData } = await supabase
          .from("kitchens")
          .select("*")
          .eq("id", invite.kitchen_id)
          .single();

        setKitchen(kitchenData);
      } catch (err) {
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

      // Sign in as anonymous user
      const { user: anonUser, error: authError } = await signInAnonymously();
      if (authError || !anonUser) {
        throw new Error("Failed to sign in anonymously");
      }

      // Update user metadata with display name
      if (displayName) {
        await supabase.auth.updateUser({
          data: { display_name: displayName },
        });
      }

      // Create kitchen membership
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

      // Increment invite link use count
      await supabase
        .from("invite_links")
        .update({ use_count: inviteLink.use_count + 1 })
        .eq("id", inviteLink.id);

      // Redirect to kitchen prep view
      navigate(`/kitchen/${kitchen.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to join";
      setError(message);
    } finally {
      setJoining(false);
    }
  };

  // If user is already authenticated, redirect to kitchen
  useEffect(() => {
    if (user && inviteLink && kitchen) {
      // Auto-join as registered user
      const handleAutoJoin = async () => {
        try {
          const { data: existingMember } = await supabase
            .from("kitchen_members")
            .select("id")
            .eq("kitchen_id", kitchen.id)
            .eq("user_id", user.id)
            .single();

          if (existingMember) {
            // Already a member
            navigate(`/kitchen/${kitchen.id}`);
            return;
          }

          // Add user to kitchen
          const { error: memberError } = await supabase
            .from("kitchen_members")
            .insert({
              kitchen_id: kitchen.id,
              user_id: user.id,
              role: "member",
              can_invite: false,
            });

          if (memberError) throw memberError;

          // Increment invite link use count
          if (inviteLink) {
            await supabase
              .from("invite_links")
              .update({ use_count: inviteLink.use_count + 1 })
              .eq("id", inviteLink.id);
          }

          navigate(`/kitchen/${kitchen.id}`);
        } catch (err) {
          setError("Failed to join kitchen");
        }
      };

      handleAutoJoin();
    }
  }, [user, inviteLink, kitchen, navigate]);

  if (loading) {
    return (
      <CenteredPage>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Loading invite link...
          </p>
        </div>
      </CenteredPage>
    );
  }

  if (error) {
    return (
      <CenteredPage>
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invite Invalid
            </h1>
            <ErrorAlert title="Cannot Join Kitchen" message={error} />
            <Button onClick={() => navigate("/")} className="w-full mt-4">
              Return Home
            </Button>
          </div>
        </div>
      </CenteredPage>
    );
  }

  if (!kitchen || !inviteLink) {
    return null;
  }

  // If user is authenticated, show auto-join message
  if (user) {
    return (
      <CenteredPage>
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Joining {kitchen.name}...
            </p>
          </div>
        </div>
      </CenteredPage>
    );
  }

  return (
    <CenteredPage>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Join {kitchen.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enter your name to join this kitchen
          </p>

          {error && <ErrorAlert title="Join Error" message={error} />}

          <form onSubmit={handleJoinAsAnonymous} className="space-y-4">
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
              disabled={joining || !displayName.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {joining ? "Joining..." : "Join Kitchen"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-600">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm mb-4">
              Already have an account?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <p className="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </CenteredPage>
  );
}
