import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
interface AuthFormProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  submitButtonText: string;
  loading?: boolean;
  error?: string;
  footerText: string;
  footerLink: {
    text: string;
    to: string;
  };
  secondaryLink?: {
    text: string;
    to: string;
  };
}

/**
 * AuthForm - a styled form card for authentication pages.
 *
 * This is just the form content - it expects to be rendered inside
 * a layout (PublicLayout) that provides the page shell, header, and footer.
 */
export function AuthForm({
  title,
  subtitle,
  children,
  onSubmit,
  submitButtonText,
  loading = false,
  error,
  footerText,
  footerLink,
  secondaryLink,
}: AuthFormProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className={`text-3xl font-bold mb-2 cursor-default ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h1>
        <p className={`cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>{subtitle}</p>
      </div>

      {/* Card */}
      <Card padding="lg">
        <form onSubmit={onSubmit} className="space-y-5">
          {error && <Alert variant="error">{error}</Alert>}
          {children}
          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? "Loading..." : submitButtonText}
          </Button>
          {secondaryLink && (
            <div className="text-center mt-3">
              <Link
                to={secondaryLink.to}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                {secondaryLink.text}
              </Link>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {footerText}{" "}
            <Link
              to={footerLink.to}
              className="text-orange-500 hover:text-orange-600 font-medium cursor-pointer"
            >
              {footerLink.text}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
