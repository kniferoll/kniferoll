import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Create mocks using vi.hoisted
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

// Import after mocking
import {
  redirectToCheckout,
  getCustomerPortalUrl,
  redirectToCustomerPortal,
} from "@/lib/stripe";

describe("stripe", () => {
  let originalLocation: Location;

  beforeEach(() => {
    vi.clearAllMocks();
    // Save original location
    originalLocation = window.location;
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original location
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe("redirectToCheckout", () => {
    const checkoutOptions = {
      userId: "user-123",
      planTier: "pro" as const,
      successUrl: "https://example.com/success",
      cancelUrl: "https://example.com/cancel",
    };

    it("creates checkout session and redirects on success", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionUrl: "https://checkout.stripe.com/session123" },
        error: null,
      });

      await redirectToCheckout(checkoutOptions);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
        "create-checkout-session",
        {
          body: {
            userId: "user-123",
            planTier: "pro",
            successUrl: "https://example.com/success",
            cancelUrl: "https://example.com/cancel",
          },
        }
      );
      expect(window.location.href).toBe("https://checkout.stripe.com/session123");
    });

    it("throws error when edge function returns error", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Invalid user" },
      });

      await expect(redirectToCheckout(checkoutOptions)).rejects.toThrow("Invalid user");
    });

    it("throws error when no session URL is returned", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { sessionUrl: null },
        error: null,
      });

      await expect(redirectToCheckout(checkoutOptions)).rejects.toThrow(
        "No checkout URL returned"
      );
    });

    it("throws error with default message when error has no message", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(redirectToCheckout(checkoutOptions)).rejects.toThrow(
        "Failed to create checkout session"
      );
    });
  });

  describe("getCustomerPortalUrl", () => {
    const portalOptions = {
      userId: "user-123",
      returnUrl: "https://example.com/settings",
    };

    it("returns portal URL on success", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { portalUrl: "https://billing.stripe.com/portal123" },
        error: null,
      });

      const url = await getCustomerPortalUrl(portalOptions);

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith("create-portal-session", {
        body: {
          userId: "user-123",
          returnUrl: "https://example.com/settings",
        },
      });
      expect(url).toBe("https://billing.stripe.com/portal123");
    });

    it("throws error when edge function returns error", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Customer not found" },
      });

      await expect(getCustomerPortalUrl(portalOptions)).rejects.toThrow("Customer not found");
    });

    it("throws error with default message when error has no message", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: {},
      });

      await expect(getCustomerPortalUrl(portalOptions)).rejects.toThrow(
        "Failed to create portal session"
      );
    });
  });

  describe("redirectToCustomerPortal", () => {
    const portalOptions = {
      userId: "user-123",
      returnUrl: "https://example.com/settings",
    };

    it("redirects to portal URL on success", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: { portalUrl: "https://billing.stripe.com/portal123" },
        error: null,
      });

      await redirectToCustomerPortal(portalOptions);

      expect(window.location.href).toBe("https://billing.stripe.com/portal123");
    });

    it("throws error when portal URL fetch fails", async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "Portal creation failed" },
      });

      await expect(redirectToCustomerPortal(portalOptions)).rejects.toThrow(
        "Portal creation failed"
      );
    });
  });
});
