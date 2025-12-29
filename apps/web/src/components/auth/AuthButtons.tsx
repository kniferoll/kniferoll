import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";

export function AuthButtons() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (user) return null;

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
        Log In
      </Button>
      <Button variant="primary" size="sm" onClick={() => navigate("/signup")}>
        Sign Up
      </Button>
    </>
  );
}
