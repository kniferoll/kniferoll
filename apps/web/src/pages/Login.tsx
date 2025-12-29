import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { FormInput, AuthForm } from "@/components";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, loading, user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Show nothing while redirecting to prevent white flash
  if (user || isSubmitting) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Signing in...
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthForm
      title="Login"
      subtitle="Sign in to manage your kitchen"
      onSubmit={handleSubmit}
      submitButtonText="Sign In"
      loading={loading}
      error={error}
      footerText="Don't have an account?"
      footerLink={{ text: "Sign up", to: "/signup" }}
    >
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </AuthForm>
  );
}
