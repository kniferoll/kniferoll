import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVisualViewport } from "@/hooks/useVisualViewport";

describe("useVisualViewport", () => {
  let mockViewport: {
    height: number;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let viewportListeners: { resize: ((e?: Event) => void)[]; scroll: ((e?: Event) => void)[] };
  let originalVisualViewport: VisualViewport | null;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Save originals
    originalVisualViewport = window.visualViewport;
    originalInnerHeight = window.innerHeight;

    // Reset listeners
    viewportListeners = { resize: [], scroll: [] };

    // Mock visualViewport
    mockViewport = {
      height: 800,
      addEventListener: vi.fn((event: string, listener: (e?: Event) => void) => {
        if (event === "resize") viewportListeners.resize.push(listener);
        if (event === "scroll") viewportListeners.scroll.push(listener);
      }),
      removeEventListener: vi.fn((event: string, listener: (e?: Event) => void) => {
        if (event === "resize") {
          const idx = viewportListeners.resize.indexOf(listener);
          if (idx > -1) viewportListeners.resize.splice(idx, 1);
        }
        if (event === "scroll") {
          const idx = viewportListeners.scroll.indexOf(listener);
          if (idx > -1) viewportListeners.scroll.splice(idx, 1);
        }
      }),
    };

    // Set window.innerHeight
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    });

    // Set visualViewport
    Object.defineProperty(window, "visualViewport", {
      value: mockViewport,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(window, "visualViewport", {
      value: originalVisualViewport,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      value: originalInnerHeight,
      writable: true,
      configurable: true,
    });
  });

  describe("initial state", () => {
    it("starts with zero keyboard offset when viewport matches inner height", () => {
      const { result } = renderHook(() => useVisualViewport());

      expect(result.current.keyboardOffset).toBe(0);
    });

    it("sets up resize and scroll event listeners", () => {
      renderHook(() => useVisualViewport());

      expect(mockViewport.addEventListener).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(mockViewport.addEventListener).toHaveBeenCalledWith("scroll", expect.any(Function));
    });
  });

  describe("keyboard detection", () => {
    it("sets offset when keyboard opens (offset > 100px)", () => {
      const { result } = renderHook(() => useVisualViewport());

      // Simulate keyboard opening - viewport shrinks
      act(() => {
        mockViewport.height = 500; // 300px keyboard
        viewportListeners.resize.forEach((listener) => listener());
      });

      expect(result.current.keyboardOffset).toBe(300);
    });

    it("ignores small offset changes (< 100px, like URL bar)", () => {
      const { result } = renderHook(() => useVisualViewport());

      // Simulate small viewport change (URL bar hiding)
      act(() => {
        mockViewport.height = 750; // Only 50px difference
        viewportListeners.resize.forEach((listener) => listener());
      });

      expect(result.current.keyboardOffset).toBe(0);
    });

    it("resets offset when keyboard closes", () => {
      const { result } = renderHook(() => useVisualViewport());

      // Open keyboard
      act(() => {
        mockViewport.height = 500;
        viewportListeners.resize.forEach((listener) => listener());
      });

      expect(result.current.keyboardOffset).toBe(300);

      // Close keyboard
      act(() => {
        mockViewport.height = 800;
        viewportListeners.resize.forEach((listener) => listener());
      });

      expect(result.current.keyboardOffset).toBe(0);
    });
  });

  describe("scroll events", () => {
    it("recalculates offset on scroll", () => {
      const { result } = renderHook(() => useVisualViewport());

      // Keyboard is open
      act(() => {
        mockViewport.height = 500;
        viewportListeners.scroll.forEach((listener) => listener());
      });

      expect(result.current.keyboardOffset).toBe(300);
    });
  });

  describe("cleanup", () => {
    it("removes event listeners on unmount", () => {
      const { unmount } = renderHook(() => useVisualViewport());

      unmount();

      expect(mockViewport.removeEventListener).toHaveBeenCalledWith(
        "resize",
        expect.any(Function)
      );
      expect(mockViewport.removeEventListener).toHaveBeenCalledWith(
        "scroll",
        expect.any(Function)
      );
    });
  });

  describe("when visualViewport is not available", () => {
    it("does not throw when visualViewport is null", () => {
      Object.defineProperty(window, "visualViewport", {
        value: null,
        writable: true,
        configurable: true,
      });

      expect(() => {
        renderHook(() => useVisualViewport());
      }).not.toThrow();
    });

    it("returns zero offset when visualViewport is null", () => {
      Object.defineProperty(window, "visualViewport", {
        value: null,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useVisualViewport());

      expect(result.current.keyboardOffset).toBe(0);
    });
  });
});
