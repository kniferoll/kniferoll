import { Link } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { Logo } from "@/components/layout/Logo";

/**
 * Footer for public/marketing pages.
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
        <Logo size="sm" />

        {/* Links */}
        <div
          className={`flex items-center gap-6 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <Link to="/help" className="hover:text-orange-500 transition-colors">
            Help
          </Link>
          <a href="mailto:support@kniferoll.io" className="hover:text-orange-500 transition-colors">
            Support
          </a>
          <Link to="/privacy" className="hover:text-orange-500 transition-colors">
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
