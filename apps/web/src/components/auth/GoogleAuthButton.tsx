import { useState } from "react";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/Button";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.582c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.582 9 3.582z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface GoogleAuthButtonProps {
  onError?: (error: string) => void;
}

export function GoogleAuthButton({ onError }: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithGoogle } = useAuthStore();

  const handleClick = async () => {
    setIsLoading(true);
    const result = await signInWithGoogle();
    if (result.error) {
      onError?.(result.error);
      setIsLoading(false);
    }
    // Don't set loading to false on success - page will redirect
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      fullWidth
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-3"
    >
      <GoogleIcon />
      <span>{isLoading ? "Redirecting..." : "Continue with Google"}</span>
    </Button>
  );
}
