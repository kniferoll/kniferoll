import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mocks using vi.hoisted so they're available when vi.mock runs
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib", () => ({
  supabase: mockSupabase,
  signInAnonymously: vi.fn(),
  getTodayLocalDate: vi.fn(() => "2024-06-15"),
}));

// Import after mocking
import { useKitchenStore } from "@/stores/kitchenStore";

describe("kitchenStore", () => {
  const mockKitchen = {
    id: "kitchen-1",
    name: "Test Kitchen",
    owner_id: "user-1",
    created_at: "2024-01-01",
  };

  const mockStations = [
    { id: "s1", name: "Prep", kitchen_id: "kitchen-1", display_order: 0 },
    { id: "s2", name: "Grill", kitchen_id: "kitchen-1", display_order: 1 },
  ];

  const mockMembership = {
    id: "m1",
    kitchen_id: "kitchen-1",
    user_id: "user-1",
    role: "owner",
    can_invite: true,
  };

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    user_metadata: { name: "Test User" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    useKitchenStore.setState({
      currentKitchen: null,
      stations: [],
      currentUser: null,
      membership: null,
      loading: false,
      error: null,
      selectedDate: "2024-06-15",
      selectedShift: "",
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = useKitchenStore.getState();
      expect(state.currentKitchen).toBeNull();
      expect(state.stations).toEqual([]);
      expect(state.currentUser).toBeNull();
      expect(state.membership).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.selectedDate).toBe("2024-06-15");
      expect(state.selectedShift).toBe("");
    });
  });

  describe("setSelectedDate", () => {
    it("updates selected date", () => {
      useKitchenStore.getState().setSelectedDate("2024-07-20");
      expect(useKitchenStore.getState().selectedDate).toBe("2024-07-20");
    });
  });

  describe("setSelectedShift", () => {
    it("updates selected shift", () => {
      useKitchenStore.getState().setSelectedShift("dinner");
      expect(useKitchenStore.getState().selectedShift).toBe("dinner");
    });
  });

  describe("clearKitchen", () => {
    it("resets all kitchen state", () => {
      // Set some state first
      useKitchenStore.setState({
        currentKitchen: mockKitchen as never,
        stations: mockStations as never,
        currentUser: { id: "u1", displayName: "Test", isAnonymous: false },
        membership: mockMembership as never,
        error: "some error",
        selectedDate: "2024-12-25",
        selectedShift: "lunch",
      });

      useKitchenStore.getState().clearKitchen();

      const state = useKitchenStore.getState();
      expect(state.currentKitchen).toBeNull();
      expect(state.stations).toEqual([]);
      expect(state.currentUser).toBeNull();
      expect(state.membership).toBeNull();
      expect(state.error).toBeNull();
      expect(state.selectedDate).toBe("2024-06-15"); // Reset to today
      expect(state.selectedShift).toBe("");
    });
  });

  describe("loadKitchen", () => {
    it("loads kitchen data on success", async () => {
      // Mock kitchen query
      const kitchenChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockKitchen, error: null }),
      };

      // Mock stations query
      const stationsChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockStations, error: null }),
      };

      // Mock membership query
      const membershipChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "kitchens") {
          return { select: vi.fn(() => kitchenChain) };
        }
        if (table === "stations") {
          return { select: vi.fn(() => stationsChain) };
        }
        if (table === "kitchen_members") {
          return { select: vi.fn(() => membershipChain) };
        }
        return {};
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await useKitchenStore.getState().loadKitchen("kitchen-1");

      const state = useKitchenStore.getState();
      expect(state.currentKitchen).toEqual(mockKitchen);
      expect(state.stations).toEqual(mockStations);
      expect(state.membership).toEqual(mockMembership);
      expect(state.loading).toBe(false);
    });

    it("sets loading state during load", async () => {
      const kitchenChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockImplementation(async () => {
          expect(useKitchenStore.getState().loading).toBe(true);
          return { data: mockKitchen, error: null };
        }),
      };

      const stationsChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "kitchens") {
          return { select: vi.fn(() => kitchenChain) };
        }
        if (table === "stations") {
          return { select: vi.fn(() => stationsChain) };
        }
        return { select: vi.fn(() => ({ eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) })) };
      });

      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

      await useKitchenStore.getState().loadKitchen("kitchen-1");

      expect(useKitchenStore.getState().loading).toBe(false);
    });

    it("sets error when kitchen not found", async () => {
      const kitchenChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      mockSupabase.from.mockReturnValue({ select: vi.fn(() => kitchenChain) });

      await useKitchenStore.getState().loadKitchen("nonexistent");

      expect(useKitchenStore.getState().error).toBe("Not found");
      expect(useKitchenStore.getState().loading).toBe(false);
    });

    it("handles stations fetch error", async () => {
      const kitchenChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockKitchen, error: null }),
      };

      const stationsChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Stations error" } }),
      };

      mockSupabase.from.mockImplementation((table) => {
        if (table === "kitchens") {
          return { select: vi.fn(() => kitchenChain) };
        }
        if (table === "stations") {
          return { select: vi.fn(() => stationsChain) };
        }
        return {};
      });

      await useKitchenStore.getState().loadKitchen("kitchen-1");

      expect(useKitchenStore.getState().error).toBe("Stations error");
    });
  });

  describe("createKitchen", () => {
    it("creates kitchen with stations and returns kitchen id", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock all the database operations
      mockSupabase.from.mockImplementation((table) => {
        if (table === "kitchens") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockKitchen, error: null }),
              })),
            })),
          };
        }
        if (table === "kitchen_members") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: mockMembership, error: null }),
              })),
            })),
          };
        }
        if (table === "stations") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn().mockResolvedValue({ data: mockStations, error: null }),
            })),
          };
        }
        if (table === "kitchen_shifts") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn().mockResolvedValue({
                data: [
                  { id: "sh1", name: "Breakfast" },
                  { id: "sh2", name: "Lunch" },
                  { id: "sh3", name: "Dinner" },
                ],
                error: null,
              }),
            })),
          };
        }
        if (table === "kitchen_shift_days") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === "kitchen_units") {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      const result = await useKitchenStore.getState().createKitchen("My Kitchen", ["Prep", "Grill"]);

      expect(result.kitchenId).toBe("kitchen-1");
      expect(result.error).toBeUndefined();

      const state = useKitchenStore.getState();
      expect(state.currentKitchen).toEqual(mockKitchen);
      expect(state.stations).toEqual(mockStations);
    });

    it("returns error when not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await useKitchenStore.getState().createKitchen("My Kitchen", ["Prep"]);

      expect(result.error).toBe("Not authenticated");
      expect(useKitchenStore.getState().error).toBe("Not authenticated");
    });

    it("handles kitchen creation error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Creation failed", code: "error" },
            }),
          })),
        })),
      });

      const result = await useKitchenStore.getState().createKitchen("My Kitchen", ["Prep"]);

      expect(result.error).toBe("Creation failed");
    });
  });

  describe("joinKitchenViaInvite", () => {
    const mockInviteLink = {
      id: "invite-1",
      token: "abc123",
      kitchen_id: "kitchen-1",
      kitchens: mockKitchen,
      revoked: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      use_count: 0,
      max_uses: 10,
    };

    it("returns error for invalid invite link", async () => {
      const inviteChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
      };

      mockSupabase.from.mockReturnValue({ select: vi.fn(() => inviteChain) });

      const result = await useKitchenStore.getState().joinKitchenViaInvite("invalid-token", "Guest");

      expect(result.error).toBe("Invalid or expired invite link");
    });

    it("returns error for revoked invite link", async () => {
      const revokedInvite = { ...mockInviteLink, revoked: true };
      const inviteChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: revokedInvite, error: null }),
      };

      mockSupabase.from.mockReturnValue({ select: vi.fn(() => inviteChain) });

      const result = await useKitchenStore.getState().joinKitchenViaInvite("abc123", "Guest");

      expect(result.error).toBe("Invite link has expired");
    });

    it("returns error for expired invite link", async () => {
      const expiredInvite = {
        ...mockInviteLink,
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      };
      const inviteChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: expiredInvite, error: null }),
      };

      mockSupabase.from.mockReturnValue({ select: vi.fn(() => inviteChain) });

      const result = await useKitchenStore.getState().joinKitchenViaInvite("abc123", "Guest");

      expect(result.error).toBe("Invite link has expired");
    });

    it("returns error when max uses reached", async () => {
      const maxedInvite = { ...mockInviteLink, use_count: 10, max_uses: 10 };
      const inviteChain = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: maxedInvite, error: null }),
      };

      mockSupabase.from.mockReturnValue({ select: vi.fn(() => inviteChain) });

      const result = await useKitchenStore.getState().joinKitchenViaInvite("abc123", "Guest");

      expect(result.error).toBe("Invite link has reached max uses");
    });
  });
});
