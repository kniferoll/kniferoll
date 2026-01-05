import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { useAuthStore } from "@/stores";
import { Card } from "@/components/ui/Card";

export function NotFound() {
  const { isDark } = useDarkModeContext();
  const { user } = useAuthStore();

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-amber-50 via-amber-50/80 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div className="w-full max-w-md text-center">
        <h1
          className={`text-8xl font-bold mb-4 ${
            isDark ? "text-slate-700" : "text-amber-200"
          }`}
        >
          404
        </h1>
        <h2
          className={`text-2xl font-semibold mb-2 ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Page not found
        </h2>
        <p
          className={`mb-8 ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Card padding="lg">
          <div className="flex flex-col gap-3">
            <Link
              to={user ? "/dashboard" : "/"}
              className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors text-center"
            >
              {user ? "Go to Dashboard" : "Go to Homepage"}
            </Link>
            {user && (
              <Link
                to="/"
                className={`w-full px-4 py-2.5 font-medium rounded-lg transition-colors text-center ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Homepage
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
