import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext } from "@/context";

interface UserAvatarMenuProps {
  kitchenId?: string;
  onInvite?: () => void;
}

export function UserAvatarMenu({ kitchenId, onInvite }: UserAvatarMenuProps) {
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

  // Get user's display name from metadata
  // - Registered users: user_metadata.name (from signup)
  // - Anonymous users: user_metadata.display_name (from join flow)
  const getUserDisplayName = (): string | null => {
    const name = user?.user_metadata?.name;
    if (name && typeof name === "string") return name;
    const displayName = user?.user_metadata?.display_name;
    if (displayName && typeof displayName === "string") return displayName;
    return null;
  };

  const userDisplayName = getUserDisplayName();

  // Get user initials from name or email
  const getUserInitials = () => {
    if (userDisplayName) {
      return userDisplayName
        .split(" ")
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 2) || "U";
    }
    // Fall back to email
    if (user?.email) {
      return user.email
        .split("@")[0]
        .split(".")
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
        .slice(0, 2) || "U";
    }
    // Default for users without name or email
    return "U";
  };

  const userInitials = getUserInitials();

  const menuItemStyles = `w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
    isDark
      ? "text-gray-300 hover:bg-slate-700 hover:text-white"
      : "text-gray-700 hover:bg-stone-100 hover:text-gray-900"
  }`;

  const dividerStyles = `my-2 ${isDark ? "bg-slate-700" : "bg-stone-200"}`;

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
          {/* User info */}
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
              {userDisplayName || user?.email?.split("@")[0] || "Guest"}
            </div>
            <div
              className={`text-xs mt-1 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {user?.email || "Anonymous user"}
            </div>
          </div>

          <div className="py-2">
            {/* Kitchen-specific items (only when in a kitchen) */}
            {kitchenId && (
              <>
                <button
                  onClick={() => {
                    navigate(`/kitchen/${kitchenId}/settings`);
                    setUserMenuOpen(false);
                  }}
                  className={menuItemStyles}
                >
                  <span className="flex items-center gap-3">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Kitchen Settings
                  </span>
                </button>
                {onInvite && (
                  <button
                    onClick={() => {
                      onInvite();
                      setUserMenuOpen(false);
                    }}
                    className={menuItemStyles}
                  >
                    <span className="flex items-center gap-3">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      Invite Team
                    </span>
                  </button>
                )}
                <div className={dividerStyles} style={{ height: "1px" }} />
              </>
            )}

            {/* Account items */}
            <button
              onClick={() => {
                // TODO: navigate to account settings
                setUserMenuOpen(false);
              }}
              className={menuItemStyles}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Account Settings
              </span>
            </button>
            <button
              onClick={() => {
                // TODO: navigate to billing
                setUserMenuOpen(false);
              }}
              className={menuItemStyles}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  />
                </svg>
                Billing
              </span>
            </button>
            <button
              onClick={() => {
                // TODO: navigate to help
                setUserMenuOpen(false);
              }}
              className={menuItemStyles}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Help & Support
              </span>
            </button>

            <div className={dividerStyles} style={{ height: "1px" }} />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                isDark
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
