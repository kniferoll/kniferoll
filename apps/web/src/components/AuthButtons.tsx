import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useDarkModeContext } from "../context/DarkModeContext";

export function AuthButtons() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isDark } = useDarkModeContext();

  if (user) return null;

  return (
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
  );
}
