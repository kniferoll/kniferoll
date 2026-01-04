import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { preloadDashboard } from "@/lib/preload";
import { validateEmail, validatePassword } from "@/lib";
import { AuthForm, FormInput } from "@/components";
import { Card } from "@/components/ui/Card";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { signUp, loading, user, session } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  // Preload dashboard - user will likely go there after signup
  useEffect(() => {
    preloadDashboard();
  }, []);

  useEffect(() => {
    if (user && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, session, navigate]);

  if (user && session) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Creating account...
        </p>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold mb-2 cursor-default ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Check your email
          </h1>
          <p
            className={`cursor-default ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            We sent a confirmation link to your email
          </p>
        </div>

        <Card padding="lg">
          <p
            className={`text-center mb-6 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Click the link in the email to verify your account. If you don't
            see it, check your spam folder.
          </p>
          <div className="text-center">
            <Link
              to="/login"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Back to login
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Creating account...
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || "Invalid password");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(trimmedEmail, password, trimmedName);
      if (result.error) {
        setError(result.error);
      } else {
        // If no session, email confirmation is required
        const currentSession = useAuthStore.getState().session;
        if (!currentSession) {
          setShowConfirmation(true);
        }
        // If session exists, useEffect will handle navigation
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div data-testid="page-signup">
      <AuthForm
        title="Create Account"
        subtitle="Get started with your first prep list"
        onSubmit={handleSubmit}
        submitButtonText="Create Account"
        loading={loading}
        error={error}
        footerText="Already have an account?"
        footerLink={{ text: "Sign in", to: "/login" }}
      >
        <FormInput
          id="name"
          label="Your Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          minLength={8}
          helperText="At least 8 characters"
          error={passwordError}
        />
      </AuthForm>
    </div>
  );
}
