import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { validatePassword, validatePasswordMatch } from "@/lib";
import { FormInput, PasswordRequirements } from "@/components";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

export function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const { updatePassword, session } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  // Check if we have a valid session from the magic link
  useEffect(() => {
    // Give a moment for the auth state to settle after redirect
    const timer = setTimeout(() => {
      if (session) {
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmError("");
    setError("");

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || "Invalid password");
      return;
    }

    const matchValidation = validatePasswordMatch(password, confirmPassword);
    if (!matchValidation.isValid) {
      setConfirmError(matchValidation.error || "Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isValid === null) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Verifying reset link...</p>
      </div>
    );
  }

  // Invalid/expired link
  if (!isValid) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold mb-2 cursor-default ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Invalid or expired link
          </h1>
          <p className={`cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            This password reset link is no longer valid
          </p>
        </div>

        <Card padding="lg">
          <p className={`text-center mb-6 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            Password reset links expire after a short time for security. Please request a new one.
          </p>
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Request new reset link
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="page-reset-password" className="w-full max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <h1
          className={`text-3xl font-bold mb-2 cursor-default ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Set new password
        </h1>
        <p className={`cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Enter your new password below
        </p>
      </div>

      <Card padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <FormInput
              id="password"
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
            />
            <div className="mt-2">
              <PasswordRequirements password={password} />
            </div>
          </div>
          <FormInput
            id="confirm-password"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={confirmError}
          />
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
