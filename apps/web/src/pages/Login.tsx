import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { preloadDashboard } from "@/lib/preload";
import { validateEmail } from "@/lib";
import { FormInput, AuthForm, GoogleAuthButton } from "@/components";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Preload dashboard - user will likely go there after login
  useEffect(() => {
    preloadDashboard();
  }, []);

  // Check for OAuth errors in URL hash (Supabase returns errors there)
  useEffect(() => {
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const errorDescription = hashParams.get("error_description");
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
      // Clear the hash from URL
      window.history.replaceState(null, "", location.pathname);
    }
  }, [location]);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user || isSubmitting) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Signing in...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    const trimmedEmail = email.trim();
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(trimmedEmail, password);
      if (result.error) {
        setError(result.error);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="page-login">
      <AuthForm
        title="Login"
        subtitle="Sign in to manage your kitchen"
        onSubmit={handleSubmit}
        submitButtonText="Sign In"
        loading={isSubmitting}
        error={error}
        footerText="Don't have an account?"
        footerLink={{ text: "Sign up", to: "/signup" }}
        secondaryLink={{ text: "Forgot password?", to: "/forgot-password" }}
        oauthSection={<GoogleAuthButton onError={setError} />}
      >
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <FormInput
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </AuthForm>
    </div>
  );
}
