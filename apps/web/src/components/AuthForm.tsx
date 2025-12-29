import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDarkModeContext } from "../context/DarkModeContext";

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
}: AuthFormProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="w-full max-w-md mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-8">
        <h1
          className={`text-3xl font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h1>
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>{subtitle}</p>
      </div>

      {/* Card */}
      <div
        className={`rounded-2xl border p-8 ${
          isDark
            ? "bg-slate-800/50 border-slate-700"
            : "bg-white border-stone-200 shadow-lg shadow-stone-900/5"
        }`}
      >
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div
              className={`p-3 rounded-lg text-sm ${
                isDark
                  ? "bg-red-950/50 text-red-400 border border-red-900/50"
                  : "bg-red-50 text-red-600 border border-red-100"
              }`}
            >
              {error}
            </div>
          )}

          {children}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-base font-semibold rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
          >
            {loading ? "Loading..." : submitButtonText}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {footerText}{" "}
            <Link
              to={footerLink.to}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              {footerLink.text}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
