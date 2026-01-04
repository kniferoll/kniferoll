import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { validateEmail } from "@/lib";
import { FormInput, AuthForm } from "@/components";
import { Card } from "@/components/ui/Card";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPasswordForEmail } = useAuthStore();
  const { isDark } = useDarkModeContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");

    const trimmedEmail = email.trim();
    const emailValidation = validateEmail(trimmedEmail);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || "Invalid email");
      return;
    }

    setIsSubmitting(true);
    // Always show success for security - don't reveal if email exists
    await resetPasswordForEmail(trimmedEmail);
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  if (isSuccess) {
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
            We sent a password reset link to your email
          </p>
        </div>

        <Card padding="lg">
          <p
            className={`text-center mb-6 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Click the link in the email to reset your password. If you don't
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

  return (
    <div data-testid="page-forgot-password">
      <AuthForm
        title="Reset password"
        subtitle="Enter your email to receive a reset link"
        onSubmit={handleSubmit}
        submitButtonText="Send reset link"
        loading={isSubmitting}
        footerText="Remember your password?"
        footerLink={{ text: "Sign in", to: "/login" }}
      >
        <FormInput
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
      </AuthForm>
    </div>
  );
}
