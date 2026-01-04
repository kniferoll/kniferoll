import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Create hoisted mocks
const { mockGetUserProfile, mockGetOwnedKitchenCount, mockGetStationCount, mockGetUserLimits } =
  vi.hoisted(() => ({
    mockGetUserProfile: vi.fn(),
    mockGetOwnedKitchenCount: vi.fn(),
    mockGetStationCount: vi.fn(),
    mockGetUserLimits: vi.fn(),
  }));

// Mock the auth store
const mockUseAuthStore = vi.hoisted(() =>
  vi.fn(() => ({
    user: { id: "user-123" },
  }))
);

vi.mock("@/stores", () => ({
  useAuthStore: mockUseAuthStore,
}));

vi.mock("@/lib", () => ({
  getUserProfile: mockGetUserProfile,
  getOwnedKitchenCount: mockGetOwnedKitchenCount,
  getStationCount: mockGetStationCount,
  getUserLimits: mockGetUserLimits,
}));

// Import after mocking
import { usePlanLimits, usePaywall } from "@/hooks/usePlanLimits";

describe("usePlanLimits", () => {
  const mockProfile = {
    id: "user-123",
    plan: "free" as const,
  };

  const mockLimits = {
    maxKitchens: 1,
    maxStationsPerKitchen: 1,
    canInviteAsOwner: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({ user: { id: "user-123" } });
    mockGetUserProfile.mockResolvedValue(mockProfile);
    mockGetOwnedKitchenCount.mockResolvedValue(0);
    mockGetUserLimits.mockReturnValue(mockLimits);
    mockGetStationCount.mockResolvedValue(0);
  });

  describe("initial state", () => {
    it("starts with loading true", () => {
      const { result } = renderHook(() => usePlanLimits());

      expect(result.current.loading).toBe(true);
      expect(result.current.limits).toBeNull();
    });
  });

  describe("with authenticated user", () => {
    it("loads limits successfully", async () => {
      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.limits).toEqual({
        plan: "free",
        maxKitchens: 1,
        ownedKitchens: 0,
        canCreateKitchen: true,
        maxStationsPerKitchen: 1,
        canInviteAsOwner: false,
      });
      expect(result.current.error).toBeNull();
    });

    it("sets canCreateKitchen to false when at limit", async () => {
      mockGetOwnedKitchenCount.mockResolvedValue(1);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.limits?.canCreateKitchen).toBe(false);
    });

    it("handles profile not found error", async () => {
      mockGetUserProfile.mockResolvedValue(null);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("User profile not found");
      expect(result.current.limits).toBeNull();
    });

    it("handles generic error", async () => {
      mockGetUserProfile.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("handles non-Error thrown values", async () => {
      mockGetUserProfile.mockRejectedValue("string error");

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to load limits");
    });
  });

  describe("without authenticated user", () => {
    it("sets limits to null and loading to false", async () => {
      mockUseAuthStore.mockReturnValue({ user: null as unknown as { id: string } });

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.limits).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe("canCreateStation", () => {
    it("returns true when under limit", async () => {
      mockGetStationCount.mockResolvedValue(0);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canCreate = await result.current.canCreateStation("kitchen-1");

      expect(canCreate).toBe(true);
      expect(mockGetStationCount).toHaveBeenCalledWith("kitchen-1");
    });

    it("returns false when at limit", async () => {
      mockGetStationCount.mockResolvedValue(1);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canCreate = await result.current.canCreateStation("kitchen-1");

      expect(canCreate).toBe(false);
    });

    it("returns false when no user", async () => {
      mockUseAuthStore.mockReturnValue({ user: null as unknown as { id: string } });

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const canCreate = await result.current.canCreateStation("kitchen-1");

      expect(canCreate).toBe(false);
    });

    it("returns false when limits not loaded", async () => {
      // Don't wait for loading to complete
      const { result } = renderHook(() => usePlanLimits());

      // Call immediately while still loading
      const canCreate = await result.current.canCreateStation("kitchen-1");

      expect(canCreate).toBe(false);
    });
  });

  describe("pro plan", () => {
    it("loads pro plan limits", async () => {
      const proProfile = { ...mockProfile, plan: "pro" as const };
      const proLimits = {
        maxKitchens: 5,
        maxStationsPerKitchen: 999,
        canInviteAsOwner: true,
      };

      mockGetUserProfile.mockResolvedValue(proProfile);
      mockGetUserLimits.mockReturnValue(proLimits);
      mockGetOwnedKitchenCount.mockResolvedValue(2);

      const { result } = renderHook(() => usePlanLimits());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.limits).toEqual({
        plan: "pro",
        maxKitchens: 5,
        ownedKitchens: 2,
        canCreateKitchen: true,
        maxStationsPerKitchen: 999,
        canInviteAsOwner: true,
      });
    });
  });
});

describe("usePaywall", () => {
  it("starts with paywall hidden", () => {
    const { result } = renderHook(() => usePaywall());

    expect(result.current.showPaywall).toBe(false);
    expect(result.current.paywallReason).toBeNull();
  });

  describe("showKitchenPaywall", () => {
    it("shows paywall with kitchen_limit reason", () => {
      const { result } = renderHook(() => usePaywall());

      act(() => {
        result.current.showKitchenPaywall();
      });

      expect(result.current.showPaywall).toBe(true);
      expect(result.current.paywallReason).toBe("kitchen_limit");
    });
  });

  describe("showStationPaywall", () => {
    it("shows paywall with station_limit reason", () => {
      const { result } = renderHook(() => usePaywall());

      act(() => {
        result.current.showStationPaywall();
      });

      expect(result.current.showPaywall).toBe(true);
      expect(result.current.paywallReason).toBe("station_limit");
    });
  });

  describe("showInvitePaywall", () => {
    it("shows paywall with invite_limit reason", () => {
      const { result } = renderHook(() => usePaywall());

      act(() => {
        result.current.showInvitePaywall();
      });

      expect(result.current.showPaywall).toBe(true);
      expect(result.current.paywallReason).toBe("invite_limit");
    });
  });

  describe("closePaywall", () => {
    it("hides paywall and clears reason", () => {
      const { result } = renderHook(() => usePaywall());

      // First show a paywall
      act(() => {
        result.current.showKitchenPaywall();
      });

      expect(result.current.showPaywall).toBe(true);

      // Then close it
      act(() => {
        result.current.closePaywall();
      });

      expect(result.current.showPaywall).toBe(false);
      expect(result.current.paywallReason).toBeNull();
    });
  });

  describe("switching paywall reasons", () => {
    it("can switch between different paywall reasons", () => {
      const { result } = renderHook(() => usePaywall());

      act(() => {
        result.current.showKitchenPaywall();
      });
      expect(result.current.paywallReason).toBe("kitchen_limit");

      act(() => {
        result.current.showStationPaywall();
      });
      expect(result.current.paywallReason).toBe("station_limit");

      act(() => {
        result.current.showInvitePaywall();
      });
      expect(result.current.paywallReason).toBe("invite_limit");
    });
  });
});
