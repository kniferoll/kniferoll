import { describe, it, expect, vi, beforeEach } from "vitest";

// Create mocks using vi.hoisted
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/lib", () => ({
  supabase: mockSupabase,
  rankSuggestions: vi.fn((suggestions: unknown[]) => suggestions),
  captureError: vi.fn(),
}));

// Import after mocking
import { usePrepEntryStore } from "@/stores/prepEntryStore";

describe("prepEntryStore", () => {
  const mockSuggestion = {
    id: "suggestion-1",
    kitchen_item_id: "item-1",
    station_id: "station-1",
    shift_id: "shift-1",
    use_count: 5,
    last_used: "2024-01-01T00:00:00Z",
    last_quantity: 2,
    last_unit_id: "unit-1",
    kitchen_items: { name: "Carrots" },
  };

  const mockUnit = {
    id: "unit-1",
    kitchen_id: "kitchen-1",
    name: "lb",
    abbreviation: "lb",
    category: "weight",
    created_at: "2024-01-01T00:00:00Z",
  };

  const mockPrepItem = {
    id: "prep-1",
    station_id: "station-1",
    shift_id: "shift-1",
    shift_date: "2024-01-01",
    kitchen_item_id: "item-1",
    unit_id: "unit-1",
    quantity: 5,
    quantity_raw: "5 lb",
    status: "pending",
    created_by_user: "user-1",
    kitchen_items: { name: "Carrots" },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    usePrepEntryStore.setState({
      suggestions: [],
      allRankedSuggestions: [],
      masterSuggestions: [],
      currentItems: [],
      quickUnits: [],
      allUnits: [],
      dismissedSuggestionIds: new Set(),
      suggestionsLoading: false,
      unitsLoading: false,
      addingItem: false,
      error: null,
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = usePrepEntryStore.getState();
      expect(state.suggestions).toEqual([]);
      expect(state.allRankedSuggestions).toEqual([]);
      expect(state.masterSuggestions).toEqual([]);
      expect(state.currentItems).toEqual([]);
      expect(state.quickUnits).toEqual([]);
      expect(state.allUnits).toEqual([]);
      expect(state.dismissedSuggestionIds.size).toBe(0);
      expect(state.suggestionsLoading).toBe(false);
      expect(state.unitsLoading).toBe(false);
      expect(state.addingItem).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("dismissSuggestion", () => {
    it("adds suggestion id to dismissed set", () => {
      usePrepEntryStore.setState({
        allRankedSuggestions: [
          { ...mockSuggestion, id: "s1", description: "Carrots" },
          { ...mockSuggestion, id: "s2", description: "Onions" },
        ] as never[],
        currentItems: [],
      });

      usePrepEntryStore.getState().dismissSuggestion("s1");

      const state = usePrepEntryStore.getState();
      expect(state.dismissedSuggestionIds.has("s1")).toBe(true);
    });

    it("updates displayed suggestions to exclude dismissed", () => {
      const suggestions = [
        { ...mockSuggestion, id: "s1", description: "Carrots" },
        { ...mockSuggestion, id: "s2", description: "Onions", kitchen_item_id: "item-2" },
        { ...mockSuggestion, id: "s3", description: "Potatoes", kitchen_item_id: "item-3" },
        { ...mockSuggestion, id: "s4", description: "Celery", kitchen_item_id: "item-4" },
      ] as never[];

      usePrepEntryStore.setState({
        allRankedSuggestions: suggestions,
        suggestions: suggestions.slice(0, 3),
        currentItems: [],
      });

      usePrepEntryStore.getState().dismissSuggestion("s1");

      const state = usePrepEntryStore.getState();
      // s1 should be replaced by s4 in the displayed suggestions
      expect(state.suggestions.some((s: { id: string }) => s.id === "s1")).toBe(false);
    });

    it("can dismiss multiple suggestions", () => {
      usePrepEntryStore.getState().dismissSuggestion("s1");
      usePrepEntryStore.getState().dismissSuggestion("s2");
      usePrepEntryStore.getState().dismissSuggestion("s3");

      const state = usePrepEntryStore.getState();
      expect(state.dismissedSuggestionIds.size).toBe(3);
      expect(state.dismissedSuggestionIds.has("s1")).toBe(true);
      expect(state.dismissedSuggestionIds.has("s2")).toBe(true);
      expect(state.dismissedSuggestionIds.has("s3")).toBe(true);
    });
  });

  describe("clearDismissals", () => {
    it("clears all dismissed suggestion ids", () => {
      usePrepEntryStore.setState({
        dismissedSuggestionIds: new Set(["s1", "s2", "s3"]),
      });

      usePrepEntryStore.getState().clearDismissals();

      expect(usePrepEntryStore.getState().dismissedSuggestionIds.size).toBe(0);
    });
  });

  describe("addUnit", () => {
    it("adds a unit to allUnits", () => {
      usePrepEntryStore.setState({ allUnits: [] });

      usePrepEntryStore.getState().addUnit(mockUnit as never);

      const state = usePrepEntryStore.getState();
      expect(state.allUnits).toHaveLength(1);
      expect(state.allUnits[0]).toEqual(mockUnit);
    });

    it("appends to existing units", () => {
      const existingUnit = { ...mockUnit, id: "unit-0", name: "kg" };
      usePrepEntryStore.setState({ allUnits: [existingUnit] as never[] });

      usePrepEntryStore.getState().addUnit(mockUnit as never);

      const state = usePrepEntryStore.getState();
      expect(state.allUnits).toHaveLength(2);
    });
  });

  describe("dismissSuggestionPersistent", () => {
    it("calls dismissSuggestion internally", async () => {
      const dismissSpy = vi.spyOn(usePrepEntryStore.getState(), "dismissSuggestion");
      usePrepEntryStore.setState({
        allRankedSuggestions: [],
        currentItems: [],
      });

      await usePrepEntryStore
        .getState()
        .dismissSuggestionPersistent("s1", "station-1", "2024-01-01", "shift-1", "user-1");

      expect(dismissSpy).toHaveBeenCalledWith("s1");
    });
  });

  describe("loadSuggestionsAndUnits", () => {
    it("sets loading states to true on start", async () => {
      // Mock the queries to take some time
      const suggestionsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          setTimeout(() => resolve({ data: [], error: null }), 10),
      };
      const unitsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          setTimeout(() => resolve({ data: [], error: null }), 10),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "prep_item_suggestions") return suggestionsChain;
        if (table === "kitchen_units") return unitsChain;
        return suggestionsChain;
      });

      // Don't await, just start the load
      usePrepEntryStore.getState().loadSuggestionsAndUnits("kitchen-1");

      // Check that loading states were set
      const state = usePrepEntryStore.getState();
      expect(state.suggestionsLoading).toBe(true);
      expect(state.unitsLoading).toBe(true);
    });

    it("loads suggestions and units successfully", async () => {
      const suggestionsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: [mockSuggestion], error: null }),
      };
      const unitsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [mockUnit], error: null }),
      };
      const prepItemsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [mockPrepItem], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "prep_item_suggestions") return suggestionsChain;
        if (table === "kitchen_units") return unitsChain;
        if (table === "prep_items") return prepItemsChain;
        return suggestionsChain;
      });

      await usePrepEntryStore
        .getState()
        .loadSuggestionsAndUnits("kitchen-1", "station-1", "2024-01-01", "shift-1");

      const state = usePrepEntryStore.getState();
      expect(state.suggestionsLoading).toBe(false);
      expect(state.unitsLoading).toBe(false);
      expect(state.allUnits).toHaveLength(1);
    });

    it("handles suggestions error", async () => {
      const suggestionsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: null, error: { message: "Suggestions error" } }),
      };
      const unitsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [mockUnit], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "prep_item_suggestions") return suggestionsChain;
        if (table === "kitchen_units") return unitsChain;
        return suggestionsChain;
      });

      await usePrepEntryStore
        .getState()
        .loadSuggestionsAndUnits("kitchen-1", "station-1", "2024-01-01", "shift-1");

      const state = usePrepEntryStore.getState();
      expect(state.error).toBe("Suggestions error");
      expect(state.suggestionsLoading).toBe(false);
    });

    it("handles units error", async () => {
      const suggestionsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };
      const unitsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: null, error: { message: "Units error" } }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "prep_item_suggestions") return suggestionsChain;
        if (table === "kitchen_units") return unitsChain;
        return suggestionsChain;
      });

      await usePrepEntryStore
        .getState()
        .loadSuggestionsAndUnits("kitchen-1", "station-1", "2024-01-01", "shift-1");

      const state = usePrepEntryStore.getState();
      expect(state.error).toBe("Units error");
      expect(state.unitsLoading).toBe(false);
    });

    it("uses empty suggestions when no context provided", async () => {
      const suggestionsChain = {
        select: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };
      const unitsChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "prep_item_suggestions") return suggestionsChain;
        if (table === "kitchen_units") return unitsChain;
        return suggestionsChain;
      });

      await usePrepEntryStore.getState().loadSuggestionsAndUnits("kitchen-1");

      // Should use limit(0) for suggestions when no context
      expect(suggestionsChain.limit).toHaveBeenCalledWith(0);
    });
  });

  describe("addItemWithUpdates", () => {
    it("returns error when no user id", async () => {
      const result = await usePrepEntryStore
        .getState()
        .addItemWithUpdates(
          "kitchen-1",
          "station-1",
          "2024-01-01",
          "shift-1",
          "Carrots",
          "unit-1",
          5,
          ""
        );

      expect(result).toEqual({ error: "User ID required" });
    });

    it("sets addingItem to true during operation", async () => {
      // Mock the queries
      const queryChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPrepItem, error: null }),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(queryChain);

      // Start the operation
      const promise = usePrepEntryStore
        .getState()
        .addItemWithUpdates(
          "kitchen-1",
          "station-1",
          "2024-01-01",
          "shift-1",
          "Carrots",
          "unit-1",
          5,
          "user-1"
        );

      // Check that addingItem was set to true
      expect(usePrepEntryStore.getState().addingItem).toBe(true);

      await promise;
    });

    it("creates new kitchen item when not found", async () => {
      // First query: search for existing item - returns empty
      const searchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };

      // Insert chain for kitchen_items
      const insertItemChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: "new-item-id" }, error: null }),
      };

      // Insert chain for prep_items
      const insertPrepChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPrepItem, error: null }),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "kitchen_items") {
          callCount++;
          // First call is search, second is insert
          return callCount === 1 ? searchChain : insertItemChain;
        }
        if (table === "prep_items") return insertPrepChain;
        return searchChain;
      });

      const result = await usePrepEntryStore.getState().addItemWithUpdates(
        "kitchen-1",
        "station-1",
        "2024-01-01",
        "shift-1",
        "  Carrots  ", // Test trimming
        "unit-1",
        5,
        "user-1"
      );

      expect(result).toEqual({});
      expect(usePrepEntryStore.getState().addingItem).toBe(false);
    });

    it("uses existing kitchen item when found", async () => {
      // Search finds existing item
      const searchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: [{ id: "existing-item-id" }], error: null }),
      };

      // Insert chain for prep_items
      const insertPrepChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockPrepItem, error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "kitchen_items") return searchChain;
        if (table === "prep_items") return insertPrepChain;
        return searchChain;
      });

      const result = await usePrepEntryStore
        .getState()
        .addItemWithUpdates(
          "kitchen-1",
          "station-1",
          "2024-01-01",
          "shift-1",
          "Carrots",
          null,
          null,
          "user-1"
        );

      expect(result).toEqual({});
    });

    it("handles kitchen item creation error", async () => {
      const searchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) => resolve({ data: [], error: null }),
      };

      const insertChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      };

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "kitchen_items") {
          callCount++;
          return callCount === 1 ? searchChain : insertChain;
        }
        return searchChain;
      });

      const result = await usePrepEntryStore
        .getState()
        .addItemWithUpdates(
          "kitchen-1",
          "station-1",
          "2024-01-01",
          "shift-1",
          "Carrots",
          null,
          null,
          "user-1"
        );

      expect(result).toEqual({ error: "Insert failed" });
      expect(usePrepEntryStore.getState().addingItem).toBe(false);
    });

    it("handles prep item creation error", async () => {
      const searchChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: [{ id: "existing-item-id" }], error: null }),
      };

      const insertPrepChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Prep insert failed" },
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === "kitchen_items") return searchChain;
        if (table === "prep_items") return insertPrepChain;
        return searchChain;
      });

      const result = await usePrepEntryStore
        .getState()
        .addItemWithUpdates(
          "kitchen-1",
          "station-1",
          "2024-01-01",
          "shift-1",
          "Carrots",
          null,
          null,
          "user-1"
        );

      expect(result).toEqual({ error: "Prep insert failed" });
    });
  });
});
