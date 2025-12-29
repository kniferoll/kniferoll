import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";

export function UserAvatarMenu() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-avatar-menu]")) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [userMenuOpen]);

  const handleSignOut = async () => {
    await useAuthStore.getState().signOut();
    navigate("/login");
  };

  const userInitials =
    user?.email
      ?.split("@")[0]
      .split(".")
      .map((part) => part[0].toUpperCase())
      .join("")
      .slice(0, 2) || "U";

  return (
    <div className="relative" data-avatar-menu>
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all cursor-pointer ${
          isDark
            ? "bg-linear-to-br from-gray-600 to-gray-700 text-gray-200 hover:from-gray-500 hover:to-gray-600"
            : "bg-linear-to-br from-orange-200 to-orange-300 text-orange-900 hover:from-orange-300 hover:to-orange-400"
        } ${
          userMenuOpen
            ? isDark
              ? "ring-2 ring-orange-500/50"
              : "ring-2 ring-orange-400"
            : ""
        }`}
      >
        {userInitials}
      </button>

      {userMenuOpen && (
        <div
          className={`absolute top-12 right-0 w-56 rounded-xl shadow-xl border ${
            isDark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-stone-200"
          } overflow-hidden z-50`}
        >
          <div
            className={`px-4 py-3 border-b ${
              isDark ? "border-slate-700" : "border-stone-200"
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {user?.email?.split("@")[0]}
            </div>
            <div
              className={`text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {user?.email}
            </div>
          </div>
          <div className="py-2">
            {["Account Settings", "Billing", "Help & Support"].map((item) => (
              <button
                key={item}
                className={`w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
                  isDark
                    ? "text-gray-300 hover:bg-slate-700 hover:text-white"
                    : "text-gray-700 hover:bg-stone-100 hover:text-gray-900"
                }`}
              >
                {item}
              </button>
            ))}
            <div
              className={`my-2 ${isDark ? "bg-slate-700" : "bg-stone-200"}`}
              style={{ height: "1px" }}
            />
            <button
              onClick={handleSignOut}
              className={`w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer ${
                isDark
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
