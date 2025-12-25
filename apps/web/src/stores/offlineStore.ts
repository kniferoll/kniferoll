import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PendingAction {
  id: string;
  type: "toggle_complete" | "add_item" | "delete_item" | "update_item";
  payload: any;
  timestamp: number;
}

interface OfflineState {
  isOnline: boolean;
  pendingActions: PendingAction[];

  // Actions
  setOnline: (online: boolean) => void;
  addPendingAction: (action: Omit<PendingAction, "id" | "timestamp">) => void;
  removePendingAction: (id: string) => void;
  clearPendingActions: () => void;
  initialize: () => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set) => ({
      isOnline: navigator.onLine,
      pendingActions: [],

      setOnline: (online) => {
        set({ isOnline: online });
      },

      addPendingAction: (action) => {
        const newAction: PendingAction = {
          ...action,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };

        set((state) => ({
          pendingActions: [...state.pendingActions, newAction],
        }));
      },

      removePendingAction: (id) => {
        set((state) => ({
          pendingActions: state.pendingActions.filter((a) => a.id !== id),
        }));
      },

      clearPendingActions: () => {
        set({ pendingActions: [] });
      },

      initialize: () => {
        // Set up online/offline listeners
        const handleOnline = () => {
          set({ isOnline: true });
          // Could trigger sync here
        };

        const handleOffline = () => {
          set({ isOnline: false });
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Set initial state
        set({ isOnline: navigator.onLine });
      },
    }),
    {
      name: "kniferoll-offline",
      partialize: (state) => ({
        pendingActions: state.pendingActions,
      }),
    }
  )
);
