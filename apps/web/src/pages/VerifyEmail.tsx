import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { useAuthStore } from "@/stores";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function VerifyEmail() {
  const { isDark } = useDarkModeContext();
  const { session } = useAuthStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Give a moment for the auth state to settle after redirect
    const timer = setTimeout(() => {
      if (session) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>
          Verifying your email...
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div data-testid="page-verify-email" className="w-full max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1
            className={`text-3xl font-bold mb-2 cursor-default ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Verification failed
          </h1>
          <p
            className={`cursor-default ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            This verification link is invalid or has expired
          </p>
        </div>

        <Card padding="lg">
          <p
            className={`text-center mb-6 ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Please try signing up again to receive a new verification email.
          </p>
          <div className="text-center">
            <Link
              to="/signup"
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="page-verify-email" className="w-full max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">✓</div>
        <h1
          className={`text-3xl font-bold mb-2 cursor-default ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Email verified
        </h1>
        <p
          className={`cursor-default ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Your account is now active
        </p>
      </div>

      <Card padding="lg">
        <p
          className={`text-center mb-6 ${
            isDark ? "text-gray-300" : "text-gray-700"
          }`}
        >
          You can now access all features. Start by creating your first kitchen!
        </p>
        <Link to="/dashboard">
          <Button variant="primary" size="lg" fullWidth>
            Go to Dashboard
          </Button>
        </Link>
      </Card>
    </div>
  );
}
