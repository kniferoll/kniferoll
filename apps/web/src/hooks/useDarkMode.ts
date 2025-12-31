import { useEffect, useState } from "react";

// Helper function to apply dark mode class to document
const applyDarkMode = (dark: boolean) => {
  const html = document.documentElement;
  if (dark) {
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
  }
};

export function useDarkMode() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has a saved preference
    const saved = localStorage.getItem("dark-mode");
    if (saved !== null) {
      const isDarkMode = saved === "true";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(isDarkMode);
      applyDarkMode(isDarkMode);
    } else {
      // Use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
       
      setIsDark(prefersDark);
      applyDarkMode(prefersDark);
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("dark-mode");
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
      localStorage.setItem("dark-mode", String(newValue));
      applyDarkMode(newValue);
      return newValue;
    });
  };

  return { isDark, toggle };
}
