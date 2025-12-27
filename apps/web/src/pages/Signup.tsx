import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { supabase } from "../lib/supabase";
import { ensureUserProfile } from "../lib/entitlements";
import { CenteredPage } from "../components/CenteredPage";
import { FormInput } from "../components/FormInput";
import { Button } from "../components/Button";
import { ErrorAlert } from "../components/ErrorAlert";

export function Signup() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Get device token to check for existing anonymous session
  useEffect(() => {
    let token = localStorage.getItem("kniferoll_device_token");
    if (!token) {
      token = crypto.randomUUID();
      localStorage.setItem("kniferoll_device_token", token);
    }
    setDeviceToken(token);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Signup failed");
        setLoading(false);
        return;
      }

      // Create user profile with free plan
      await ensureUserProfile(data.user.id, displayName || undefined);

      // If user came from anonymous session, link membership
      if (deviceToken) {
        const { data: anonUser } = await supabase
          .from("anonymous_users")
          .select("id, kitchen_members(kitchen_id)")
          .eq("device_token", deviceToken)
          .single();

        if (
          anonUser &&
          anonUser.kitchen_members &&
          anonUser.kitchen_members.length > 0
        ) {
          // Prompt user to link their anonymous session
          // For now, proceed to dashboard - could show link confirmation UI
          console.log(
            "User has anonymous kitchen memberships to link to account"
          );
        }
      }

      // Redirect to dashboard to continue onboarding
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CenteredPage>
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Join Kniferoll to manage your kitchen prep
          </p>

          {error && <ErrorAlert title="Signup Error" message={error} />}

          <form onSubmit={handleSignup} className="space-y-4">
            <FormInput
              label="Display Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
              required
            />

            <FormInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
              required
            />

            <FormInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              disabled={loading}
              required
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate("/login")}
            >
              Sign In Instead
            </Button>
          </div>

          <p className="mt-4 text-center text-gray-600 dark:text-gray-400 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </CenteredPage>
  );
}
