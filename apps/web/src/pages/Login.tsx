import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { AuthForm, FormInput } from "../components";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signIn, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn(email, password);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <AuthForm
      title="Chef Login"
      subtitle="Sign in to manage your kitchen"
      onSubmit={handleSubmit}
      submitButtonText="Sign In"
      loading={loading}
      error={error}
      footerText="Don't have an account?"
      footerLink={{ text: "Sign up", to: "/signup" }}
      backLink={{ text: "← Back to home", to: "/" }}
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
