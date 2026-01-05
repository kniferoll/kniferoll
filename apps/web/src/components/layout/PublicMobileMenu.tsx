import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { useAuthStore } from "@/stores";
import { Button } from "@/components/ui/Button";

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Mobile hamburger menu for public pages.
 * Shows a dropdown with navigation links on small screens.
 */
export function PublicMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isDark } = useDarkModeContext();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div ref={menuRef} className="relative md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${
          isDark ? "text-gray-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-stone-200/50"
        }`}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg border overflow-hidden ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-stone-200"
          }`}
        >
          <div className="py-2">
            <Link
              to="/pricing"
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                isDark ? "text-gray-300 hover:bg-slate-700/50" : "text-gray-700 hover:bg-stone-100"
              }`}
            >
              Pricing
            </Link>

            {user && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2.5 text-sm font-medium transition-colors ${
                  isDark
                    ? "text-gray-300 hover:bg-slate-700/50"
                    : "text-gray-700 hover:bg-stone-100"
                }`}
              >
                Dashboard
              </Link>
            )}

            {!user && (
              <>
                <div
                  className={`my-2 border-t ${isDark ? "border-slate-700" : "border-stone-200"}`}
                />
                <div className="px-3 py-2 space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => handleNavigate("/login")}
                  >
                    Log In
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => handleNavigate("/signup")}
                  >
                    Sign Up
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
