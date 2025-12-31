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
}));

// Import after mocking
import { usePrepStore } from "@/stores/prepStore";

describe("prepStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    usePrepStore.setState({
      prepItems: [],
      isInitialLoading: true,
      isRefetching: false,
      error: null,
      currentContext: null,
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = usePrepStore.getState();
      expect(state.prepItems).toEqual([]);
      expect(state.isInitialLoading).toBe(true);
      expect(state.isRefetching).toBe(false);
      expect(state.error).toBeNull();
      expect(state.currentContext).toBeNull();
    });
  });

  describe("clearItems", () => {
    it("resets items and context", () => {
      // Set some state first
      usePrepStore.setState({
        prepItems: [{ id: "1" }] as never,
        currentContext: { stationId: "s1", shiftDate: "2024-01-01", shiftId: "sh1" },
        isInitialLoading: true,
        isRefetching: true,
      });

      usePrepStore.getState().clearItems();

      const state = usePrepStore.getState();
      expect(state.prepItems).toEqual([]);
      expect(state.currentContext).toBeNull();
      expect(state.isInitialLoading).toBe(false);
      expect(state.isRefetching).toBe(false);
    });
  });

  describe("loadPrepItems", () => {
    it("sets initial loading state on context change", async () => {
      const orderChain = {
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        ...orderChain,
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const promise = usePrepStore.getState().loadPrepItems("station-1", "2024-01-01", "shift-1");

      // Check loading state immediately
      expect(usePrepStore.getState().isInitialLoading).toBe(true);

      await promise;

      expect(usePrepStore.getState().isInitialLoading).toBe(false);
      expect(usePrepStore.getState().currentContext).toEqual({
        stationId: "station-1",
        shiftDate: "2024-01-01",
        shiftId: "shift-1",
      });
    });

    it("sets refetching state when context is same", async () => {
      // Set initial context
      usePrepStore.setState({
        currentContext: { stationId: "station-1", shiftDate: "2024-01-01", shiftId: "shift-1" },
        isInitialLoading: false,
      });

      const orderChain = {
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        ...orderChain,
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      const promise = usePrepStore.getState().loadPrepItems("station-1", "2024-01-01", "shift-1");

      // Should be refetching, not initial loading
      expect(usePrepStore.getState().isRefetching).toBe(true);
      expect(usePrepStore.getState().isInitialLoading).toBe(false);

      await promise;
    });

    it("transforms prep items with joined data", async () => {
      const mockData = [
        {
          id: "item-1",
          station_id: "s1",
          kitchen_items: { name: "Carrots" },
          kitchen_units: { name: "lbs" },
        },
      ];
      const orderChain = {
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        ...orderChain,
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      await usePrepStore.getState().loadPrepItems("s1", "2024-01-01", "sh1");

      const items = usePrepStore.getState().prepItems;
      expect(items[0].description).toBe("Carrots");
      expect(items[0].unit_name).toBe("lbs");
    });

    it("sets error on fetch failure", async () => {
      const orderChain = {
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "Fetch failed" } }),
      };
      const eqChain = {
        eq: vi.fn().mockReturnThis(),
        ...orderChain,
      };
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => eqChain),
      });

      await usePrepStore.getState().loadPrepItems("s1", "2024-01-01", "sh1");

      expect(usePrepStore.getState().error).toBe("Fetch failed");
    });
  });

  describe("addPrepItem", () => {
    it("adds item optimistically", async () => {
      const mockInsertedItem = {
        id: "real-id",
        station_id: "s1",
        kitchen_items: { name: "Onions" },
        kitchen_units: { name: "kg" },
      };
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: mockInsertedItem, error: null }),
          })),
        })),
      });

      const item = {
        station_id: "s1",
        shift_id: "sh1",
        kitchen_item_id: "ki1",
      };

      const promise = usePrepStore.getState().addPrepItem(item, { description: "Onions" });

      // Should have temp item immediately
      const itemsDuringAdd = usePrepStore.getState().prepItems;
      expect(itemsDuringAdd.length).toBe(1);
      expect(itemsDuringAdd[0].id).toMatch(/^temp-/);

      await promise;

      // Should now have real item
      const itemsAfterAdd = usePrepStore.getState().prepItems;
      expect(itemsAfterAdd[0].id).toBe("real-id");
    });

    it("reverts on error", async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: "Insert failed" } }),
          })),
        })),
      });

      const item = {
        station_id: "s1",
        shift_id: "sh1",
        kitchen_item_id: "ki1",
      };

      const result = await usePrepStore.getState().addPrepItem(item, { description: "Test" });

      expect(result.error).toBe("Insert failed");
      expect(usePrepStore.getState().prepItems).toEqual([]);
    });
  });

  describe("cycleStatus", () => {
    beforeEach(() => {
      usePrepStore.setState({
        prepItems: [
          { id: "item-1", status: "pending", description: "Test" },
          { id: "item-2", status: "in_progress", description: "Test 2" },
          { id: "item-3", status: "complete", description: "Test 3" },
        ] as never,
      });
    });

    it("cycles pending to in_progress optimistically", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const promise = usePrepStore.getState().cycleStatus("item-1");

      // Optimistic update should happen immediately
      expect(usePrepStore.getState().prepItems[0].status).toBe("in_progress");

      await promise;
    });

    it("cycles in_progress to complete", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await usePrepStore.getState().cycleStatus("item-2");

      expect(usePrepStore.getState().prepItems[1].status).toBe("complete");
    });

    it("cycles complete to pending", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await usePrepStore.getState().cycleStatus("item-3");

      expect(usePrepStore.getState().prepItems[2].status).toBe("pending");
    });

    it("returns error when item not found", async () => {
      const result = await usePrepStore.getState().cycleStatus("nonexistent");
      expect(result.error).toBe("Item not found");
    });

    it("reverts on database error", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        })),
      });

      const result = await usePrepStore.getState().cycleStatus("item-1");

      expect(result.error).toBe("Update failed");
      // Should revert to original status
      expect(usePrepStore.getState().prepItems[0].status).toBe("pending");
    });
  });

  describe("deletePrepItem", () => {
    beforeEach(() => {
      usePrepStore.setState({
        prepItems: [
          { id: "item-1", description: "Test 1" },
          { id: "item-2", description: "Test 2" },
        ] as never,
      });
    });

    it("deletes item optimistically", async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const promise = usePrepStore.getState().deletePrepItem("item-1");

      // Optimistic delete
      expect(usePrepStore.getState().prepItems.length).toBe(1);
      expect(usePrepStore.getState().prepItems[0].id).toBe("item-2");

      await promise;
    });

    it("returns error when item not found", async () => {
      const result = await usePrepStore.getState().deletePrepItem("nonexistent");
      expect(result.error).toBe("Item not found");
    });

    it("reverts on database error", async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: { message: "Delete failed" } }),
        })),
      });

      const result = await usePrepStore.getState().deletePrepItem("item-1");

      expect(result.error).toBe("Delete failed");
      // Should revert - item should be back
      expect(usePrepStore.getState().prepItems.length).toBe(2);
    });
  });

  describe("updatePrepItem", () => {
    beforeEach(() => {
      usePrepStore.setState({
        prepItems: [
          { id: "item-1", quantity: 5, description: "Test" },
        ] as never,
      });
    });

    it("updates item optimistically", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      const promise = usePrepStore.getState().updatePrepItem("item-1", { quantity: 10 });

      // Optimistic update
      expect(usePrepStore.getState().prepItems[0].quantity).toBe(10);

      await promise;
    });

    it("returns error when item not found", async () => {
      const result = await usePrepStore.getState().updatePrepItem("nonexistent", { quantity: 10 });
      expect(result.error).toBe("Item not found");
    });

    it("reverts on database error", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: { message: "Update failed" } }),
        })),
      });

      const result = await usePrepStore.getState().updatePrepItem("item-1", { quantity: 10 });

      expect(result.error).toBe("Update failed");
      // Should revert to original
      expect(usePrepStore.getState().prepItems[0].quantity).toBe(5);
    });

    it("includes optimistic data for derived fields", async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      });

      await usePrepStore.getState().updatePrepItem(
        "item-1",
        { unit_id: "new-unit" },
        { unit_name: "kg" }
      );

      expect(usePrepStore.getState().prepItems[0].unit_name).toBe("kg");
    });
  });
});
