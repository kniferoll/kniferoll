import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { AuthForm, FormInput } from "../components";

export function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { signUp, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const result = await signUp(email, password, name);
    if (result.error) {
      setError(result.error);
    } else {
      navigate("/kitchen/new");
    }
  };

  return (
    <AuthForm
      title="Create Chef Account"
      subtitle="Get started with your first kitchen"
      onSubmit={handleSubmit}
      submitButtonText="Create Account"
      loading={loading}
      error={error}
      footerText="Already have an account?"
      footerLink={{ text: "Sign in", to: "/login" }}
      backLink={{ text: "← Back to home", to: "/" }}
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
