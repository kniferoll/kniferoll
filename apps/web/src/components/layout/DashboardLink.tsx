import { useNavigate } from "react-router-dom";
import { useDarkModeContext } from "@/context";

export function DashboardLink() {
  const navigate = useNavigate();
  const { isDark } = useDarkModeContext();

  return (
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
  );
}
