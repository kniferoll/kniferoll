import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React, { type ReactNode } from "react";

// Mock supabase before any imports that might use it
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

import { HeaderProvider, type HeaderConfig } from "@/context/HeaderContext";
import { useHeader, useHeaderConfig, useDefaultHeaderConfig } from "@/hooks/useHeader";

// Wrapper that provides HeaderContext
function Wrapper({ children }: { children: ReactNode }) {
  return <HeaderProvider>{children}</HeaderProvider>;
}

describe("useHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useHeader", () => {
    it("returns header context with setHeader function", () => {
      const { result } = renderHook(() => useHeader(), { wrapper: Wrapper });

      expect(result.current.config).toBeDefined();
      expect(result.current.setHeader).toBeDefined();
      expect(typeof result.current.setHeader).toBe("function");
    });

    it("throws error when used outside HeaderProvider", () => {
      expect(() => {
        renderHook(() => useHeader());
      }).toThrow("useHeader must be used within a HeaderProvider");
    });
  });

  describe("useHeaderConfig", () => {
    it("sets header configuration on mount", () => {
      const config: HeaderConfig = {
        visible: false,
        variant: "transparent",
      };

      const { result } = renderHook(
        () => {
          useHeaderConfig(config);
          return useHeader();
        },
        { wrapper: Wrapper }
      );

      expect(result.current.config.visible).toBe(false);
      expect(result.current.config.variant).toBe("transparent");
    });

    it("updates when dependencies change", () => {
      let variant: "default" | "transparent" = "default";

      const { result, rerender } = renderHook(
        () => {
          useHeaderConfig({ variant }, [variant]);
          return useHeader();
        },
        { wrapper: Wrapper }
      );

      expect(result.current.config.variant).toBe("default");

      // Change the variant and trigger rerender
      variant = "transparent";
      rerender();

      expect(result.current.config.variant).toBe("transparent");
    });
  });

  describe("useDefaultHeaderConfig", () => {
    it("sets default header configuration on mount only", () => {
      const config: HeaderConfig = {
        visible: true,
        variant: "minimal",
      };

      const { result, rerender } = renderHook(
        () => {
          useDefaultHeaderConfig(config);
          return useHeader();
        },
        { wrapper: Wrapper }
      );

      expect(result.current.config.variant).toBe("minimal");

      // Modify the config object (shouldn't affect since useDefaultHeaderConfig only runs once)
      config.variant = "default";
      rerender();

      // Should still be the original variant
      expect(result.current.config.variant).toBe("minimal");
    });
  });

  describe("header updates", () => {
    it("can update header via setHeader", () => {
      const { result } = renderHook(() => useHeader(), { wrapper: Wrapper });

      act(() => {
        result.current.setHeader({
          centerContent: React.createElement("span", null, "Title"),
          visible: true,
        });
      });

      expect(result.current.config.visible).toBe(true);
      expect(result.current.config.centerContent).toBeDefined();
    });

    it("can reset header configuration", () => {
      const { result } = renderHook(() => useHeader(), { wrapper: Wrapper });

      // First set a header
      act(() => {
        result.current.setHeader({
          variant: "transparent",
          visible: false,
        });
      });

      expect(result.current.config.variant).toBe("transparent");

      // Then reset it
      act(() => {
        result.current.resetHeader();
      });

      expect(result.current.config.variant).toBe("default");
      expect(result.current.config.visible).toBe(true);
    });
  });
});
