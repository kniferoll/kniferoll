import type { ReactNode } from "react";
import { Link } from "react-router-dom";

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
  backLink?: {
    text: string;
    to: string;
  };
}

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
  backLink,
}: AuthFormProps) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Gradient background blobs */}
      <div className="absolute -top-44 -right-60 h-60 w-80 md:right-0 bg-linear-to-b from-[#fff1be] via-[#ee87cb] to-[#b060ff] rotate-[-10deg] rounded-full blur-3xl opacity-40 dark:opacity-20 pointer-events-none" />
      <div className="absolute -bottom-32 -left-40 h-64 w-80 bg-linear-to-t from-[#b060ff] via-[#ee87cb] to-[#fff1be] rotate-10 rounded-full blur-3xl opacity-30 dark:opacity-10 pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 mb-2">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-slate-400">{subtitle}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-md dark:shadow-xl dark:border dark:border-slate-800 p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {children}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? "Loading..." : submitButtonText}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {footerText}{" "}
              <Link
                to={footerLink.to}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {footerLink.text}
              </Link>
            </p>
          </div>
        </div>

        {backLink && (
          <div className="mt-6 text-center">
            <Link
              to={backLink.to}
              className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            >
              {backLink.text}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
