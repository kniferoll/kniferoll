import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "../lib/supabase";
import { getTodayLocalDate } from "../lib/dateUtils";
import type { DbKitchen, DbStation } from "@kniferoll/types";

interface SessionUser {
  id: string;
  name: string;
  device_token: string;
  station_id: string | null;
}

interface KitchenState {
  currentKitchen: DbKitchen | null;
  stations: DbStation[];
  sessionUser: SessionUser | null;
  loading: boolean;
  error: string | null;
  selectedDate: string;
  selectedShift: string;

  // Actions
  createKitchen: (
    name: string,
    stationNames: string[],
    schedule?: { [key: string]: string[] },
    closedDays?: string[]
  ) => Promise<{ kitchenId?: string; error?: string }>;
  loadKitchen: (id: string) => Promise<void>;
  joinKitchen: (
    code: string,
    displayName: string
  ) => Promise<{ error?: string }>;
  claimStation: (stationId: string) => Promise<{ error?: string }>;
  setSelectedDate: (date: string) => void;
  setSelectedShift: (shift: string) => void;
  clearKitchen: () => void;
}

export const useKitchenStore = create<KitchenState>()(
  persist(
    (set, get) => ({
      currentKitchen: null,
      stations: [],
      sessionUser: null,
      loading: false,
      error: null,
      selectedDate: getTodayLocalDate(),
      selectedShift: "",

      createKitchen: async (name, stationNames, schedule, closedDays) => {
        set({ loading: true, error: null });

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user) {
            set({ loading: false, error: "Not authenticated" });
            return { error: "Not authenticated" };
          }

          // Validate that schedule has at least one shift (if provided)
          if (schedule) {
            const shifts = schedule.default || Object.values(schedule).flat();
            if (!Array.isArray(shifts) || shifts.length === 0) {
              set({
                loading: false,
                error: "At least one shift must be configured",
              });
              return { error: "At least one shift must be configured" };
            }
          }

          // Generate join code
          const joinCode = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();

          // Build shifts_config from schedule
          const shiftsConfig = schedule?.default
            ? schedule.default.map((name: string) => ({ name }))
            : [
                { name: "AM", start_time: "06:00", end_time: "14:00" },
                { name: "PM", start_time: "14:00", end_time: "22:00" },
              ];

          // Create kitchen
          const { data: kitchen, error: kitchenError } = await supabase
            .from("kitchens")
            .insert({
              name,
              owner_id: user.id,
              join_code: joinCode,
              shifts_config: shiftsConfig,
              schedule: schedule || { default: ["Lunch", "Dinner"] },
              closed_days: closedDays || [],
              plan: "free",
            })
            .select()
            .single();

          if (kitchenError || !kitchen) {
            set({ loading: false, error: kitchenError?.message });
            return { error: kitchenError?.message };
          }

          // Add owner to user_kitchens table
          const { error: membershipError } = await supabase
            .from("user_kitchens")
            .insert({
              user_id: user.id,
              kitchen_id: kitchen.id,
              role: "owner",
            });

          if (membershipError) {
            set({ loading: false, error: membershipError.message });
            return { error: membershipError.message };
          }

          // Create stations
          const stationsToInsert = stationNames.map((stationName, index) => ({
            kitchen_id: kitchen.id,
            name: stationName,
            display_order: index,
          }));

          const { data: stations, error: stationsError } = await supabase
            .from("stations")
            .insert(stationsToInsert)
            .select();

          if (stationsError) {
            set({ loading: false, error: stationsError.message });
            return { error: stationsError.message };
          }

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            loading: false,
          });

          return { kitchenId: kitchen.id };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          set({ loading: false, error: message });
          return { error: message };
        }
      },

      loadKitchen: async (id) => {
        set({ loading: true, error: null });

        try {
          const { data: kitchen, error: kitchenError } = await supabase
            .from("kitchens")
            .select("*")
            .eq("id", id)
            .single();

          if (kitchenError || !kitchen) {
            set({ loading: false, error: kitchenError?.message });
            return;
          }

          const { data: stations, error: stationsError } = await supabase
            .from("stations")
            .select("*")
            .eq("kitchen_id", id)
            .order("display_order");

          if (stationsError) {
            set({ loading: false, error: stationsError.message });
            return;
          }

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            loading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          set({ loading: false, error: message });
        }
      },

      joinKitchen: async (code, displayName) => {
        set({ loading: true, error: null });

        try {
          // Find kitchen by join code
          const { data: kitchen, error: kitchenError } = await supabase
            .from("kitchens")
            .select("*")
            .eq("join_code", code.toUpperCase())
            .single();

          if (kitchenError || !kitchen) {
            set({ loading: false, error: "Invalid join code" });
            return { error: "Invalid join code" };
          }

          // Load stations
          const { data: stations } = await supabase
            .from("stations")
            .select("*")
            .eq("kitchen_id", kitchen.id)
            .order("display_order");

          // Get or create device token
          let deviceToken = localStorage.getItem("kniferoll_device_token");
          if (!deviceToken) {
            deviceToken = crypto.randomUUID();
            localStorage.setItem("kniferoll_device_token", deviceToken);
          }

          // Upsert session user (constraint on kitchen_id + device_token)
          const { data: sessionUser, error: userError } = await supabase
            .from("session_users")
            .upsert(
              {
                kitchen_id: kitchen.id,
                name: displayName,
                device_token: deviceToken,
                station_id: null,
                last_active: new Date().toISOString(),
              },
              {
                onConflict: "kitchen_id,device_token",
              }
            )
            .select()
            .single();

          if (userError || !sessionUser) {
            set({ loading: false, error: userError?.message });
            return { error: userError?.message };
          }

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            sessionUser: {
              id: sessionUser.id,
              name: sessionUser.name,
              device_token: sessionUser.device_token,
              station_id: sessionUser.station_id,
            },
            loading: false,
          });

          return {};
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          set({ loading: false, error: message });
          return { error: message };
        }
      },

      claimStation: async (stationId) => {
        const { sessionUser } = get();
        if (!sessionUser) {
          return { error: "No session user" };
        }

        set({ loading: true, error: null });

        try {
          const { error } = await supabase
            .from("session_users")
            .update({ station_id: stationId })
            .eq("id", sessionUser.id);

          if (error) {
            set({ loading: false, error: error.message });
            return { error: error.message };
          }

          set({
            sessionUser: { ...sessionUser, station_id: stationId },
            loading: false,
          });

          return {};
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          set({ loading: false, error: message });
          return { error: message };
        }
      },

      setSelectedDate: (date: string) => {
        set({ selectedDate: date });
      },

      setSelectedShift: (shift: string) => {
        set({ selectedShift: shift });
      },

      clearKitchen: () => {
        set({
          currentKitchen: null,
          stations: [],
          sessionUser: null,
          error: null,
          selectedDate: getTodayLocalDate(),
          selectedShift: "",
        });
      },
    }),
    {
      name: "kniferoll-kitchen",
      partialize: (state) => ({
        currentKitchen: state.currentKitchen,
        sessionUser: state.sessionUser,
        selectedDate: state.selectedDate,
        selectedShift: state.selectedShift,
      }),
    }
  )
);
