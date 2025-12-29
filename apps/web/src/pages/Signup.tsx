import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";
import { preloadDashboard } from "@/lib/preload";
import { AuthForm, FormInput } from "@/components";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signUp, loading, user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  // Preload dashboard - user will likely go there after signup
  useEffect(() => {
    preloadDashboard();
  }, []);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user || isSubmitting) {
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

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email, password, name);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
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
      />
      <FormInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        helperText="At least 6 characters"
      />
    </AuthForm>
  );
}
