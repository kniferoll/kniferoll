import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { validateEmail, validatePassword, supabase } from "@/lib";
import { useAuthStore } from "@/stores";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FormInput } from "../ui/FormInput";
import { PasswordRequirements } from "../ui/PasswordRequirements";
import { Alert } from "../ui/Alert";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CreateAccountModal - allows anonymous users to convert to registered users.
 * This preserves all their existing data since they keep the same user ID.
 */
export function CreateAccountModal({ isOpen, onClose }: CreateAccountModalProps) {
  const { isDark } = useDarkModeContext();
  const { refreshUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    const trimmedEmail = email.trim();

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

    setIsLoading(true);

    // Update the anonymous user with email and password
    const { error: updateError } = await supabase.auth.updateUser({
      email: trimmedEmail,
      password: password,
    });

    if (updateError) {
      // Handle "email already exists" gracefully
      if (updateError.message.includes("already registered")) {
        setError(
          "This email is already registered. Please use a different email or sign in to your existing account."
        );
      } else {
        setError(updateError.message);
      }
      setIsLoading(false);
      return;
    }

    // Refresh the user state
    await refreshUser();
    setShowConfirmation(true);
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setError("");
    setShowConfirmation(false);
    onClose();
  };

  if (showConfirmation) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} size="sm">
        <h2
          className={`text-xl font-semibold mb-4 cursor-default ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Check your email
        </h2>
        <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          We sent a confirmation link to your email. Click the link to verify your account and
          complete the conversion.
        </p>
        <Button type="button" variant="primary" fullWidth onClick={handleClose}>
          Got it
        </Button>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <h2
        className={`text-xl font-semibold mb-2 cursor-default ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Create Account
      </h2>
      <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Save your data by creating an account. All your existing prep lists will be preserved.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          autoFocus
        />
        <div>
          <FormInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
          <div className="mt-2">
            <PasswordRequirements password={password} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
