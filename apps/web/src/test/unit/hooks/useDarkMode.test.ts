import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useDarkMode } from "@/hooks/useDarkMode";

describe("useDarkMode", () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let mediaQueryListeners: ((e: { matches: boolean }) => void)[];

  beforeEach(() => {
    // Clear actual localStorage
    localStorage.clear();

    // Reset media query listeners
    mediaQueryListeners = [];

    // Mock matchMedia
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)" ? false : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, listener: (e: { matches: boolean }) => void) => {
        if (event === "change") {
          mediaQueryListeners.push(listener);
        }
      }),
      removeEventListener: vi.fn((event: string, listener: (e: { matches: boolean }) => void) => {
        if (event === "change") {
          const index = mediaQueryListeners.indexOf(listener);
          if (index > -1) mediaQueryListeners.splice(index, 1);
        }
      }),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal("matchMedia", matchMediaMock);

    // Clean up document classes
    document.documentElement.classList.remove("dark");
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("initial state", () => {
    it("starts with null before initialization", () => {
      const { result } = renderHook(() => useDarkMode());

      // Initially null before useEffect runs
      expect(result.current.isDark).not.toBeUndefined();
    });

    it("uses saved preference from localStorage", async () => {
      localStorage.setItem("dark-mode", "true");

      const { result } = renderHook(() => useDarkMode());

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current.isDark).toBe(true);
      });

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("uses light mode when saved preference is false", async () => {
      localStorage.setItem("dark-mode", "false");

      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("uses system preference when no saved preference", async () => {
      // Mock system prefers dark
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(true);
      });
    });

    it("uses light mode when system prefers light", async () => {
      // Mock system prefers light (default in beforeEach)
      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });
    });
  });

  describe("toggle", () => {
    it("toggles from light to dark", async () => {
      localStorage.setItem("dark-mode", "false");

      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDark).toBe(true);
      expect(localStorage.getItem("dark-mode")).toBe("true");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles from dark to light", async () => {
      localStorage.setItem("dark-mode", "true");

      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(true);
      });

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isDark).toBe(false);
      expect(localStorage.getItem("dark-mode")).toBe("false");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("persists toggle to localStorage", async () => {
      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });

      act(() => {
        result.current.toggle();
      });

      // Verify the value was set (actual localStorage was used)
      expect(localStorage.getItem("dark-mode")).toBe("true");
    });
  });

  describe("system preference changes", () => {
    it("follows system preference changes when no user preference", async () => {
      // Start with light mode system preference
      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });

      // Simulate system preference change to dark
      act(() => {
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: true });
        });
      });

      expect(result.current.isDark).toBe(true);
    });

    it("ignores system preference changes when user has saved preference", async () => {
      localStorage.setItem("dark-mode", "false");

      const { result } = renderHook(() => useDarkMode());

      await waitFor(() => {
        expect(result.current.isDark).toBe(false);
      });

      // Simulate system preference change to dark
      act(() => {
        mediaQueryListeners.forEach((listener) => {
          listener({ matches: true });
        });
      });

      // Should still be false because user preference is saved
      expect(result.current.isDark).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("removes event listener on unmount", () => {
      const removeEventListenerSpy = vi.fn();
      matchMediaMock.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerSpy,
      }));

      const { unmount } = renderHook(() => useDarkMode());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });
});
