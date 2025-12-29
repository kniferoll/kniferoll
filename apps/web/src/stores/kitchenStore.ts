import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib";
import { signInAnonymously } from "@/lib";
import { getTodayLocalDate } from "@/lib";
import type { DbKitchen, DbStation, DbKitchenMember } from "@kniferoll/types";

interface CurrentUser {
  id: string;
  displayName: string;
  isAnonymous: boolean;
}

interface KitchenState {
  currentKitchen: DbKitchen | null;
  stations: DbStation[];
  currentUser: CurrentUser | null;
  membership: DbKitchenMember | null;
  loading: boolean;
  error: string | null;
  selectedDate: string;
  selectedShift: string;

  // Actions
  createKitchen: (
    name: string,
    stationNames: string[],
    closedDays?: string[],
    perDaySchedule?: Record<string, string[]>
  ) => Promise<{ kitchenId?: string; error?: string }>;
  loadKitchen: (id: string) => Promise<void>;
  joinKitchenViaInvite: (
    token: string,
    displayName: string
  ) => Promise<{ error?: string }>;
  setSelectedDate: (date: string) => void;
  setSelectedShift: (shift: string) => void;
  clearKitchen: () => void;
}

export const useKitchenStore = create<KitchenState>()(
  persist(
    (set) => ({
      currentKitchen: null,
      stations: [],
      currentUser: null,
      membership: null,
      loading: false,
      error: null,
      selectedDate: getTodayLocalDate(),
      selectedShift: "",

      createKitchen: async (
        name,
        stationNames,
        closedDays = [],
        perDaySchedule
      ) => {
        set({ loading: true, error: null });

        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (!user) {
            set({ loading: false, error: "Not authenticated" });
            return { error: "Not authenticated" };
          }

          // Create kitchen
          const { data: kitchen, error: kitchenError } = await supabase
            .from("kitchens")
            .insert({
              name,
              owner_id: user.id,
            })
            .select()
            .single();

          if (kitchenError || !kitchen) {
            console.error("❌ DEBUG: Kitchen insert failed:", {
              error: kitchenError,
              message: kitchenError?.message,
              code: kitchenError?.code,
              details: kitchenError?.details,
              hint: kitchenError?.hint,
            });
            set({ loading: false, error: kitchenError?.message });
            return { error: kitchenError?.message };
          }

          // Add owner to kitchen_members table
          const { data: membership, error: membershipError } = await supabase
            .from("kitchen_members")
            .insert({
              kitchen_id: kitchen.id,
              user_id: user.id,
              role: "owner",
              can_invite: true,
            })
            .select()
            .single();

          if (membershipError) {
            console.error(
              "❌ DEBUG: Membership insert failed:",
              membershipError
            );
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

          // Collect all unique shifts from per-day schedule
          const allShifts = new Set<string>();
          if (perDaySchedule) {
            Object.values(perDaySchedule).forEach((shifts) => {
              shifts.forEach((shift) => allShifts.add(shift));
            });
          } else {
            // Default shifts if no schedule provided
            ["Breakfast", "Lunch", "Dinner"].forEach((s) => allShifts.add(s));
          }

          // Create shifts in order: Breakfast, Lunch, Dinner, then custom
          const shiftOrder = [
            "Breakfast",
            "Lunch",
            "Dinner",
            ...Array.from(allShifts).filter(
              (s) => !["Breakfast", "Lunch", "Dinner"].includes(s)
            ),
          ];
          const shiftsToCreate = shiftOrder
            .filter((s) => allShifts.has(s))
            .map((name, index) => ({
              kitchen_id: kitchen.id,
              name,
              display_order: index,
            }));

          const { data: shifts, error: shiftsError } = await supabase
            .from("kitchen_shifts")
            .insert(shiftsToCreate)
            .select("id, name");

          if (shiftsError || !shifts) {
            set({ loading: false, error: shiftsError?.message });
            return { error: shiftsError?.message };
          }

          // Create kitchen_shift_days with per-day schedule
          const dayNames = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ];
          const shiftNameToId = new Map(shifts.map((s) => [s.name, s.id]));

          const shiftDaysToCreate = dayNames.map((dayName, dayOfWeek) => {
            const isClosed = closedDays?.includes(dayName) ?? false;
            const dayShiftNames = perDaySchedule?.[dayName] ?? [];

            return {
              kitchen_id: kitchen.id,
              day_of_week: dayOfWeek,
              is_open: !isClosed,
              shift_ids: isClosed
                ? []
                : dayShiftNames
                    .map((name) => shiftNameToId.get(name))
                    .filter((id) => id !== undefined),
            };
          });

          const { error: shiftDaysError } = await supabase
            .from("kitchen_shift_days")
            .insert(shiftDaysToCreate);

          if (shiftDaysError) {
            set({ loading: false, error: shiftDaysError.message });
            return { error: shiftDaysError.message };
          }

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            currentUser: {
              id: user.id,
              displayName: user.user_metadata?.name || user.email || "You",
              isAnonymous: false,
            },
            membership: membership,
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

          // Load current user's membership
          const {
            data: { user },
          } = await supabase.auth.getUser();

          let membership: DbKitchenMember | null = null;
          let currentUser: CurrentUser | null = null;

          if (user) {
            const { data: m } = await supabase
              .from("kitchen_members")
              .select("*")
              .eq("kitchen_id", id)
              .eq("user_id", user.id)
              .single();

            membership = m;
            if (m) {
              currentUser = {
                id: user.id,
                displayName: user.user_metadata?.name || user.email || "You",
                isAnonymous: false,
              };
            }
          }

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            membership,
            currentUser,
            loading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          set({ loading: false, error: message });
        }
      },

      joinKitchenViaInvite: async (token, displayName) => {
        set({ loading: true, error: null });

        try {
          // Verify invite link and get kitchen
          const { data: inviteLink, error: inviteError } = await supabase
            .from("invite_links")
            .select("*, kitchens(*)")
            .eq("token", token)
            .single();

          if (inviteError || !inviteLink) {
            set({ loading: false, error: "Invalid or expired invite link" });
            return { error: "Invalid or expired invite link" };
          }

          // Check if link is expired or revoked
          if (
            inviteLink.revoked ||
            new Date(inviteLink.expires_at) < new Date()
          ) {
            set({ loading: false, error: "Invite link has expired" });
            return { error: "Invite link has expired" };
          }

          // Check if max uses reached
          if (inviteLink.use_count >= inviteLink.max_uses) {
            set({ loading: false, error: "Invite link has reached max uses" });
            return { error: "Invite link has reached max uses" };
          }

          const kitchen = (inviteLink as any).kitchens;
          if (!kitchen) {
            set({ loading: false, error: "Kitchen not found" });
            return { error: "Kitchen not found" };
          }

          // Load stations
          const { data: stations } = await supabase
            .from("stations")
            .select("*")
            .eq("kitchen_id", kitchen.id)
            .order("display_order");

          // Try to get current registered user
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          let membership: DbKitchenMember | null = null;
          let currentUser: CurrentUser | null = null;

          if (authUser) {
            // Add registered user to kitchen_members
            const { data: m, error: mError } = await supabase
              .from("kitchen_members")
              .upsert(
                {
                  kitchen_id: kitchen.id,
                  user_id: authUser.id,
                  role: "member",
                },
                { onConflict: "kitchen_id,user_id" }
              )
              .select()
              .single();

            if (!mError) {
              membership = m;
              currentUser = {
                id: authUser.id,
                displayName:
                  authUser.user_metadata?.name || authUser.email || displayName,
                isAnonymous: false,
              };
            }
          } else {
            // Sign in as anonymous user
            const { user: anonUser, error: anonError } =
              await signInAnonymously();

            if (!anonError && anonUser) {
              // Update with display name
              if (displayName) {
                await supabase.auth.updateUser({
                  data: { display_name: displayName },
                });
              }

              // Add anonymous user to kitchen_members
              const { data: m } = await supabase
                .from("kitchen_members")
                .upsert(
                  {
                    kitchen_id: kitchen.id,
                    user_id: anonUser.id,
                    role: "member",
                  },
                  { onConflict: "kitchen_id,user_id" }
                )
                .select()
                .single();

              membership = m;
              currentUser = {
                id: anonUser.id,
                displayName: displayName || "Guest",
                isAnonymous: true,
              };
            }
          }

          // Increment use count on invite link
          await supabase
            .from("invite_links")
            .update({ use_count: inviteLink.use_count + 1 })
            .eq("id", inviteLink.id);

          set({
            currentKitchen: kitchen,
            stations: stations || [],
            membership,
            currentUser,
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
          currentUser: null,
          membership: null,
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
        currentUser: state.currentUser,
        selectedDate: state.selectedDate,
        selectedShift: state.selectedShift,
      }),
    }
  )
);
