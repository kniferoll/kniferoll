import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useOfflineStore } from "@/stores/offlineStore";

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: vi.fn(() => "mock-uuid-" + Math.random().toString(36).substring(7)),
});

describe("offlineStore", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store state
    useOfflineStore.setState({
      isOnline: true,
      pendingActions: [],
    });
    // Spy on window event listeners
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const state = useOfflineStore.getState();
      expect(state.isOnline).toBe(true);
      expect(state.pendingActions).toEqual([]);
    });
  });

  describe("setOnline", () => {
    it("sets isOnline to true", () => {
      useOfflineStore.setState({ isOnline: false });
      useOfflineStore.getState().setOnline(true);

      expect(useOfflineStore.getState().isOnline).toBe(true);
    });

    it("sets isOnline to false", () => {
      useOfflineStore.setState({ isOnline: true });
      useOfflineStore.getState().setOnline(false);

      expect(useOfflineStore.getState().isOnline).toBe(false);
    });
  });

  describe("addPendingAction", () => {
    it("adds a pending action with generated id and timestamp", () => {
      const action = {
        type: "toggle_complete" as const,
        payload: { itemId: "123" },
      };

      useOfflineStore.getState().addPendingAction(action);

      const state = useOfflineStore.getState();
      expect(state.pendingActions).toHaveLength(1);
      expect(state.pendingActions[0]).toMatchObject({
        type: "toggle_complete",
        payload: { itemId: "123" },
      });
      expect(state.pendingActions[0].id).toBeDefined();
      expect(state.pendingActions[0].timestamp).toBeDefined();
    });

    it("adds multiple actions in order", () => {
      useOfflineStore.getState().addPendingAction({
        type: "add_item" as const,
        payload: { name: "Item 1" },
      });
      useOfflineStore.getState().addPendingAction({
        type: "delete_item" as const,
        payload: { id: "456" },
      });

      const state = useOfflineStore.getState();
      expect(state.pendingActions).toHaveLength(2);
      expect(state.pendingActions[0].type).toBe("add_item");
      expect(state.pendingActions[1].type).toBe("delete_item");
    });

    it("assigns unique ids to each action", () => {
      useOfflineStore.getState().addPendingAction({
        type: "update_item" as const,
        payload: {},
      });
      useOfflineStore.getState().addPendingAction({
        type: "update_item" as const,
        payload: {},
      });

      const state = useOfflineStore.getState();
      expect(state.pendingActions[0].id).not.toBe(state.pendingActions[1].id);
    });
  });

  describe("removePendingAction", () => {
    it("removes a specific action by id", () => {
      // Add two actions
      useOfflineStore.getState().addPendingAction({
        type: "add_item" as const,
        payload: { name: "Item 1" },
      });
      useOfflineStore.getState().addPendingAction({
        type: "delete_item" as const,
        payload: { id: "456" },
      });

      const actions = useOfflineStore.getState().pendingActions;
      const idToRemove = actions[0].id;

      useOfflineStore.getState().removePendingAction(idToRemove);

      const updatedActions = useOfflineStore.getState().pendingActions;
      expect(updatedActions).toHaveLength(1);
      expect(updatedActions[0].type).toBe("delete_item");
    });

    it("does nothing when removing non-existent id", () => {
      useOfflineStore.getState().addPendingAction({
        type: "add_item" as const,
        payload: {},
      });

      useOfflineStore.getState().removePendingAction("non-existent-id");

      expect(useOfflineStore.getState().pendingActions).toHaveLength(1);
    });
  });

  describe("clearPendingActions", () => {
    it("clears all pending actions", () => {
      // Add multiple actions
      useOfflineStore.getState().addPendingAction({
        type: "add_item" as const,
        payload: {},
      });
      useOfflineStore.getState().addPendingAction({
        type: "delete_item" as const,
        payload: {},
      });
      useOfflineStore.getState().addPendingAction({
        type: "update_item" as const,
        payload: {},
      });

      expect(useOfflineStore.getState().pendingActions).toHaveLength(3);

      useOfflineStore.getState().clearPendingActions();

      expect(useOfflineStore.getState().pendingActions).toEqual([]);
    });

    it("works when already empty", () => {
      useOfflineStore.getState().clearPendingActions();
      expect(useOfflineStore.getState().pendingActions).toEqual([]);
    });
  });

  describe("initialize", () => {
    it("sets up online and offline event listeners", () => {
      useOfflineStore.getState().initialize();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "online",
        expect.any(Function)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "offline",
        expect.any(Function)
      );
    });

    it("sets isOnline to navigator.onLine value", () => {
      // Mock navigator.onLine
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });

      useOfflineStore.getState().initialize();

      expect(useOfflineStore.getState().isOnline).toBe(false);

      // Reset
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
    });
  });
});
