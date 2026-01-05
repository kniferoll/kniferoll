import { useEffect, useState } from "react";
import { safeGetItem, safeSetItem } from "@/lib";

// Theme colors matching Tailwind config
const THEME_COLORS = {
  light: "#fffbeb", // amber-50
  dark: "#0f172a", // slate-900
};

// Helper function to apply dark mode class and update theme-color meta tag
const applyDarkMode = (dark: boolean) => {
  const html = document.documentElement;
  if (dark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }

  // Update theme-color meta tag for iOS PWA status bar
  const themeColor = dark ? THEME_COLORS.dark : THEME_COLORS.light;
  let metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement("meta");
    metaThemeColor.setAttribute("name", "theme-color");
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute("content", themeColor);
};

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a saved preference
    const saved = safeGetItem("dark-mode");
    if (saved !== null) {
      const isDarkMode = saved === "true";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(isDarkMode);
      applyDarkMode(isDarkMode);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

      setIsDark(prefersDark);
      applyDarkMode(prefersDark);
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = safeGetItem("dark-mode");
      if (saved === null) {
        // Only follow system if user hasn't set a preference
        setIsDark(e.matches);
        applyDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      safeSetItem("dark-mode", String(newValue));
      applyDarkMode(newValue);
      return newValue;
    });
  };

  return { isDark, toggle };
}
