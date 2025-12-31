import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUserLimits } from "@/lib/entitlements";

// Mock supabase for the async functions
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe("entitlements", () => {
  describe("getUserLimits", () => {
    it("returns correct limits for free plan", () => {
      const limits = getUserLimits("free");
      expect(limits.maxKitchens).toBe(1);
      expect(limits.maxStationsPerKitchen).toBe(1);
      expect(limits.canInviteAsOwner).toBe(false);
    });

    it("returns correct limits for pro plan", () => {
      const limits = getUserLimits("pro");
      expect(limits.maxKitchens).toBe(5);
      expect(limits.maxStationsPerKitchen).toBe(Infinity);
      expect(limits.canInviteAsOwner).toBe(true);
    });
  });

  describe("async entitlements functions", () => {
    let mockSupabase: ReturnType<typeof createMockSupabase>;

    function createMockSupabase() {
      const selectChain: Record<string, ReturnType<typeof vi.fn>> = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        maybeSingle: vi.fn(),
      };
      return {
        from: vi.fn(() => ({
          select: vi.fn(() => selectChain),
        })),
        auth: {
          getUser: vi.fn(),
        },
        selectChain,
      };
    }

    beforeEach(async () => {
      vi.resetModules();
      mockSupabase = createMockSupabase();
      vi.doMock("@/lib/supabase", () => ({
        supabase: mockSupabase,
      }));
    });

    it("getUserProfile returns profile data on success", async () => {
      const mockProfile = { id: "user-1", plan: "pro" };
      mockSupabase.selectChain.maybeSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const { getUserProfile } = await import("@/lib/entitlements");
      const result = await getUserProfile("user-1");
      expect(result).toEqual(mockProfile);
    });

    it("getUserProfile returns null on error", async () => {
      mockSupabase.selectChain.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const { getUserProfile } = await import("@/lib/entitlements");
      const result = await getUserProfile("user-1");
      expect(result).toBeNull();
    });

    it("getOwnedKitchenCount returns count on success", async () => {
      const selectChain = {
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => selectChain),
      });

      const { getOwnedKitchenCount } = await import("@/lib/entitlements");
      const result = await getOwnedKitchenCount("user-1");
      expect(result).toBe(3);
    });

    it("getOwnedKitchenCount returns 0 on error", async () => {
      const selectChain = {
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: "Error" } }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => selectChain),
      });

      const { getOwnedKitchenCount } = await import("@/lib/entitlements");
      const result = await getOwnedKitchenCount("user-1");
      expect(result).toBe(0);
    });

    it("getStationCount returns count on success", async () => {
      const selectChain = {
        eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => selectChain),
      });

      const { getStationCount } = await import("@/lib/entitlements");
      const result = await getStationCount("kitchen-1");
      expect(result).toBe(5);
    });

    it("getStationCount returns 0 on error", async () => {
      const selectChain = {
        eq: vi.fn().mockResolvedValue({ count: null, error: { message: "Error" } }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => selectChain),
      });

      const { getStationCount } = await import("@/lib/entitlements");
      const result = await getStationCount("kitchen-1");
      expect(result).toBe(0);
    });

    it("getMembership returns membership on success", async () => {
      const mockMembership = { id: "m-1", role: "owner", can_invite: true };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { getMembership } = await import("@/lib/entitlements");
      const result = await getMembership("user-1", "kitchen-1");
      expect(result).toEqual(mockMembership);
    });

    it("getMembership returns null on error", async () => {
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { getMembership } = await import("@/lib/entitlements");
      const result = await getMembership("user-1", "kitchen-1");
      expect(result).toBeNull();
    });

    it("canGenerateInvite returns true for owner", async () => {
      const mockMembership = { id: "m-1", role: "owner", can_invite: false };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { canGenerateInvite } = await import("@/lib/entitlements");
      const result = await canGenerateInvite("user-1", "kitchen-1");
      expect(result).toBe(true);
    });

    it("canGenerateInvite returns true for member with can_invite", async () => {
      const mockMembership = { id: "m-1", role: "member", can_invite: true };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { canGenerateInvite } = await import("@/lib/entitlements");
      const result = await canGenerateInvite("user-1", "kitchen-1");
      expect(result).toBe(true);
    });

    it("canGenerateInvite returns false when no membership", async () => {
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { canGenerateInvite } = await import("@/lib/entitlements");
      const result = await canGenerateInvite("user-1", "kitchen-1");
      expect(result).toBe(false);
    });

    it("canGenerateInvite returns false for member without can_invite", async () => {
      const mockMembership = { id: "m-1", role: "member", can_invite: false };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const { canGenerateInvite } = await import("@/lib/entitlements");
      const result = await canGenerateInvite("user-1", "kitchen-1");
      expect(result).toBe(false);
    });
  });
});
