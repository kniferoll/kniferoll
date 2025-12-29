import { Link } from "react-router-dom";
import { useDarkModeContext } from "../context/DarkModeContext";

/**
 * Footer for public/marketing pages.
 * Includes logo, support email, and legal links.
 */
export function PublicFooter() {
  const { isDark } = useDarkModeContext();

  return (
    <footer
      className={`relative z-10 border-t ${
        isDark ? "border-slate-700/50" : "border-stone-200/60"
      } mt-auto`}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
            </svg>
          </div>
          <span
            className={`text-sm font-medium ${
              isDark ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Kniferoll
          </span>
        </div>

        {/* Links */}
        <div
          className={`flex items-center gap-6 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <a
            href="mailto:support@kniferoll.io"
            className="hover:text-orange-500 transition-colors"
          >
            Support
          </a>
          <Link
            to="/privacy"
            className="hover:text-orange-500 transition-colors"
          >
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-orange-500 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
