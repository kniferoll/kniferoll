import { useDarkModeContext } from "../context/DarkModeContext";

export function PageFooter() {
  const { isDark } = useDarkModeContext();

  return (
    <footer
      className={`relative z-10 border-t ${
        isDark ? "border-slate-700/50" : "border-stone-200/60"
      } mt-8`}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-linear-to-br from-orange-500 to-orange-600 rounded-md flex items-center justify-center">
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
          <span className="text-sm font-medium cursor-default">Kniferoll</span>
        </div>
        <div
          className={`flex items-center gap-6 text-sm ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <a
            href="mailto:support@kniferoll.io"
            className="hover:text-orange-500 transition-colors cursor-pointer"
          >
            Support
          </a>
          <a
            href="/privacy"
            className="hover:text-orange-500 transition-colors cursor-pointer"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="hover:text-orange-500 transition-colors cursor-pointer"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
