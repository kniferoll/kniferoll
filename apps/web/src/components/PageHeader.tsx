import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useDarkModeContext } from "../context/DarkModeContext";

interface PageHeaderProps {
  showLogoClickable?: boolean;
}

export function PageHeader({ showLogoClickable = false }: PageHeaderProps) {
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const navigate = useNavigate();

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || "SC";

  const handleLogoClick = () => {
    if (showLogoClickable) {
      navigate("/");
    }
  };

  return (
    <header
      className={`relative z-10 flex justify-between items-center px-6 md:px-10 py-5 border-b ${
        isDark ? "border-slate-700/50" : "border-stone-200/60"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center gap-3 cursor-pointer`}
        onClick={handleLogoClick}
      >
        <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/25">
          <svg
            width="18"
            height="18"
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
        <span className="text-xl font-semibold tracking-tight cursor-pointer">
          Kniferoll
        </span>
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3">
        {user ? (
          <>
            <button
              onClick={() => navigate("/dashboard")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-gray-300 hover:text-white hover:bg-slate-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-stone-200/50"
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm cursor-pointer ${
                isDark
                  ? "bg-linear-to-br from-gray-600 to-gray-700 text-gray-200"
                  : "bg-linear-to-br from-orange-200 to-orange-300 text-orange-900"
              }`}
            >
              {userInitials}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate("/login")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-gray-300 hover:text-white hover:bg-slate-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-stone-200/50"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/30 transition-all cursor-pointer"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
