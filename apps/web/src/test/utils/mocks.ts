/**
 * Comprehensive test mocks for Kniferoll
 *
 * This file contains all mock data factories and Supabase mock implementations
 * needed to test pages that require data.
 */
import { vi } from "vitest";

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

export const createMockUser = (overrides = {}) => ({
  id: "mock-user-id",
  email: "test@example.com",
  user_metadata: { name: "Test User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  access_token: "mock-access-token",
  refresh_token: "mock-refresh-token",
  expires_in: 3600,
  token_type: "bearer",
  user: createMockUser(),
  ...overrides,
});

export const createMockKitchen = (overrides = {}) => ({
  id: "mock-kitchen-id",
  name: "Test Kitchen",
  owner_id: "mock-user-id",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockStation = (overrides = {}) => ({
  id: "mock-station-id",
  kitchen_id: "mock-kitchen-id",
  name: "Prep Station",
  display_order: 0,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockMember = (overrides = {}) => ({
  id: "mock-member-id",
  kitchen_id: "mock-kitchen-id",
  user_id: "mock-user-id",
  role: "owner" as const,
  can_invite: true,
  joined_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockInviteLink = (overrides = {}) => ({
  id: "mock-invite-id",
  kitchen_id: "mock-kitchen-id",
  token: "mock-token",
  created_by: "mock-user-id",
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  max_uses: 10,
  use_count: 0,
  revoked: false,
  created_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockPrepItem = (overrides = {}) => ({
  id: "mock-prep-item-id",
  station_id: "mock-station-id",
  description: "Prep tomatoes",
  status: "pending" as const,
  quantity: 5,
  unit_id: null,
  shift_date: new Date().toISOString().split("T")[0],
  shift_id: "mock-shift-id",
  created_by: "mock-user-id",
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

export const createMockShift = (overrides = {}) => ({
  id: "mock-shift-id",
  kitchen_id: "mock-kitchen-id",
  name: "Lunch",
  display_order: 0,
  ...overrides,
});

export const createMockShiftDay = (overrides = {}) => ({
  id: "mock-shift-day-id",
  kitchen_id: "mock-kitchen-id",
  day_of_week: 0,
  is_open: true,
  shift_ids: ["mock-shift-id"],
  ...overrides,
});

export const createMockUnit = (overrides = {}) => ({
  id: "mock-unit-id",
  kitchen_id: "mock-kitchen-id",
  name: "Each",
  display_name: "Each",
  category: "count",
  ...overrides,
});

// ============================================================================
// DEFAULT MOCK DATA SETS
// ============================================================================

export const defaultMockData = {
  user: createMockUser(),
  session: createMockSession(),
  kitchen: createMockKitchen(),
  stations: [
    // Use "mock-station-id" to match useParams mock in tests
    createMockStation({ id: "mock-station-id", name: "Prep Station", display_order: 0 }),
    createMockStation({ id: "station-2", name: "Grill Station", display_order: 1 }),
  ],
  members: [createMockMember()],
  inviteLink: createMockInviteLink(),
  prepItems: [
    createMockPrepItem({ id: "prep-1", description: "Dice onions", status: "pending" }),
    createMockPrepItem({ id: "prep-2", description: "Prep tomatoes", status: "in_progress" }),
    createMockPrepItem({ id: "prep-3", description: "Make stock", status: "complete" }),
  ],
  shifts: [
    createMockShift({ id: "shift-1", name: "Breakfast", display_order: 0 }),
    createMockShift({ id: "shift-2", name: "Lunch", display_order: 1 }),
    createMockShift({ id: "shift-3", name: "Dinner", display_order: 2 }),
  ],
  shiftDays: [
    createMockShiftDay({ day_of_week: 0, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 1, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 2, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 3, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 4, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 5, is_open: true, shift_ids: ["shift-1", "shift-2", "shift-3"] }),
    createMockShiftDay({ day_of_week: 6, is_open: false, shift_ids: [] }),
  ],
  units: [
    createMockUnit({ id: "unit-1", name: "Each", display_name: "Each" }),
    createMockUnit({ id: "unit-2", name: "Lb", display_name: "Pound" }),
    createMockUnit({ id: "unit-3", name: "Quart", display_name: "Quart" }),
  ],
};

// ============================================================================
// SUPABASE QUERY BUILDER MOCK
// ============================================================================

type MockDataKey = keyof typeof defaultMockData;

interface QueryState {
  table: string;
  filters: Array<{ column: string; value: unknown }>;
  selectColumns: string;
}

/**
 * Creates a chainable query builder mock that returns appropriate data
 * based on the table and filters applied.
 */
export function createSupabaseQueryMock(customData: Partial<typeof defaultMockData> = {}) {
  const data = { ...defaultMockData, ...customData };

  const getDataForTable = (table: string, state: QueryState): unknown => {
    const tableMap: Record<string, MockDataKey> = {
      kitchens: "kitchen",
      stations: "stations",
      kitchen_members: "members",
      invite_links: "inviteLink",
      prep_items: "prepItems",
      kitchen_shifts: "shifts",
      kitchen_shift_days: "shiftDays",
      kitchen_units: "units",
    };

    const dataKey = tableMap[table];
    if (!dataKey) return null;

    let result: unknown = data[dataKey];

    // Apply filters
    for (const filter of state.filters) {
      if (Array.isArray(result)) {
        result = result.filter((item) => {
          const itemVal = (item as Record<string, unknown>)[filter.column];
          return itemVal === filter.value;
        });
      } else if (result && typeof result === "object") {
        const itemVal = (result as Record<string, unknown>)[filter.column];
        if (itemVal !== filter.value) {
          return null;
        }
      }
    }

    return result;
  };

  const createChain = (state: QueryState) => {
    const chain: Record<string, unknown> = {
      select: vi.fn((columns = "*") => {
        state.selectColumns = columns;
        return chain;
      }),
      eq: vi.fn((column: string, value: unknown) => {
        state.filters.push({ column, value });
        return chain;
      }),
      in: vi.fn((column: string, values: unknown[]) => {
        // For 'in' queries, we filter items where column value is in the array
        const originalFilters = state.filters;
        state.filters = originalFilters;
        // Store as special filter
        (state as unknown as Record<string, unknown>).inFilter = { column, values };
        return chain;
      }),
      order: vi.fn(() => chain),
      single: vi.fn(() => {
        const result = getDataForTable(state.table, state);
        const singleResult = Array.isArray(result) ? result[0] ?? null : result;
        return Promise.resolve({ data: singleResult, error: null });
      }),
      maybeSingle: vi.fn(() => {
        const result = getDataForTable(state.table, state);
        const singleResult = Array.isArray(result) ? result[0] ?? null : result;
        return Promise.resolve({ data: singleResult, error: null });
      }),
      then: (resolve: (value: { data: unknown; error: null }) => void) => {
        let result = getDataForTable(state.table, state);
        // Handle 'in' filter
        const inFilter = (state as unknown as Record<string, { column: string; values: unknown[] }>).inFilter;
        if (inFilter && Array.isArray(result)) {
          result = result.filter((item) => {
            const itemVal = (item as Record<string, unknown>)[inFilter.column];
            return inFilter.values.includes(itemVal);
          });
        }
        resolve({ data: result, error: null });
      },
    };
    return chain;
  };

  return {
    from: vi.fn((table: string) => {
      const state: QueryState = { table, filters: [], selectColumns: "*" };
      const chain = createChain(state);
      return {
        ...chain,
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        upsert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      };
    }),
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: data.session }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: data.user }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({ data: { session: data.session, user: data.user }, error: null })
      ),
      signUp: vi.fn(() =>
        Promise.resolve({ data: { session: data.session, user: data.user }, error: null })
      ),
      updateUser: vi.fn(() => Promise.resolve({ data: { user: data.user }, error: null })),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
  };
}

// ============================================================================
// ZUSTAND STORE MOCKS
// ============================================================================

/**
 * Creates a mock auth store.
 * By default returns user: null to support public pages (Login, Signup, Landing).
 * Pass { user: defaultMockData.user } for authenticated page tests.
 */
export const createMockAuthStore = (overrides = {}) => ({
  user: null,
  session: null,
  loading: false,
  initialized: true,
  initialize: vi.fn(),
  signIn: vi.fn(() => Promise.resolve({ error: undefined })),
  signUp: vi.fn(() => Promise.resolve({ error: undefined })),
  signOut: vi.fn(() => Promise.resolve()),
  resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: undefined })),
  updatePassword: vi.fn(() => Promise.resolve({ error: undefined })),
  refreshUser: vi.fn(() => Promise.resolve()),
  ...overrides,
});

/**
 * Creates a mock auth store with an authenticated user.
 * Use this for pages that require authentication.
 */
export const createMockAuthStoreWithUser = (overrides = {}) =>
  createMockAuthStore({
    user: defaultMockData.user,
    session: defaultMockData.session,
    ...overrides,
  });

export const createMockKitchenStore = (overrides = {}) => ({
  currentKitchen: defaultMockData.kitchen,
  stations: defaultMockData.stations,
  currentUser: {
    id: defaultMockData.user.id,
    displayName: defaultMockData.user.user_metadata.name,
    isAnonymous: false,
  },
  membership: defaultMockData.members[0],
  loading: false,
  error: null,
  selectedDate: new Date().toISOString().split("T")[0],
  selectedShift: "Lunch",
  createKitchen: vi.fn(() => Promise.resolve({ kitchenId: "mock-kitchen-id" })),
  loadKitchen: vi.fn(() => Promise.resolve()),
  joinKitchenViaInvite: vi.fn(() => Promise.resolve({ error: undefined })),
  setSelectedDate: vi.fn(),
  setSelectedShift: vi.fn(),
  clearKitchen: vi.fn(),
  ...overrides,
});

export const createMockPrepStore = (overrides = {}) => ({
  prepItems: defaultMockData.prepItems,
  isInitialLoading: false,
  loadPrepItems: vi.fn(() => Promise.resolve()),
  cycleStatus: vi.fn(() => Promise.resolve()),
  deletePrepItem: vi.fn(() => Promise.resolve()),
  updatePrepItem: vi.fn(() => Promise.resolve()),
  ...overrides,
});

export const createMockPrepEntryStore = (overrides = {}) => ({
  suggestions: [],
  masterSuggestions: [],
  quickUnits: defaultMockData.units,
  allUnits: defaultMockData.units,
  addingItem: false,
  loadSuggestionsAndUnits: vi.fn(() => Promise.resolve()),
  addItemWithUpdates: vi.fn(() => Promise.resolve({ id: "new-item-id" })),
  dismissSuggestionPersistent: vi.fn(() => Promise.resolve()),
  ...overrides,
});

// ============================================================================
// HOOK MOCKS
// ============================================================================

export const createMockHooks = (overrides: Record<string, unknown> = {}) => ({
  useStations: vi.fn(() => ({
    stations: defaultMockData.stations,
    loading: false,
    isInitialLoading: false,
    error: null,
    refetch: vi.fn(),
  })),
  useCreateStation: vi.fn(() => ({
    createStation: vi.fn(() => Promise.resolve(defaultMockData.stations[0])),
    loading: false,
    error: null,
  })),
  useKitchen: vi.fn(() => ({
    kitchen: defaultMockData.kitchen,
    members: defaultMockData.members,
    loading: false,
    error: null,
  })),
  useKitchens: vi.fn(() => ({
    kitchens: [defaultMockData.kitchen],
    loading: false,
    error: null,
  })),
  usePlanLimits: vi.fn(() => ({
    limits: {
      maxKitchens: 5,
      maxStationsPerKitchen: 999,
      canInviteAsOwner: true,
      plan: "pro",
    },
    canCreateStation: vi.fn(() => Promise.resolve(true)),
    canCreateKitchen: true,
  })),
  useStripeCheckout: vi.fn(() => ({
    handleCheckout: vi.fn(() => Promise.resolve()),
    loading: false,
  })),
  useRealtimeStations: vi.fn(),
  useRealtimePrepItems: vi.fn(),
  useRealtimeMembers: vi.fn(),
  useHeaderConfig: vi.fn(),
  useVisualViewport: vi.fn(() => ({
    keyboardOffset: 0,
    viewportHeight: 800,
  })),
  useInviteLinks: vi.fn(() => ({
    inviteLinks: [],
    loading: false,
    error: null,
    createInviteLink: vi.fn(() => Promise.resolve(defaultMockData.inviteLink)),
    revokeInviteLink: vi.fn(() => Promise.resolve()),
  })),
  useKitchenShifts: vi.fn(() => ({
    shifts: defaultMockData.shifts,
    loading: false,
  })),
  useKitchenUnits: vi.fn(() => ({
    units: defaultMockData.units,
    loading: false,
  })),
  usePrepItems: vi.fn(() => ({
    prepItems: defaultMockData.prepItems,
    loading: false,
    error: null,
  })),
  useItemSuggestions: vi.fn(() => ({
    suggestions: [],
    loading: false,
  })),
  useMemberActions: vi.fn(() => ({
    removeMember: vi.fn(() => Promise.resolve()),
    updateMemberRole: vi.fn(() => Promise.resolve()),
    loading: false,
  })),
  usePrepItemActions: vi.fn(() => ({
    addPrepItem: vi.fn(() => Promise.resolve()),
    updatePrepItem: vi.fn(() => Promise.resolve()),
    deletePrepItem: vi.fn(() => Promise.resolve()),
    loading: false,
  })),
  useUserSubscription: vi.fn(() => ({
    subscription: { plan: "pro" },
    loading: false,
  })),
  ...overrides,
});

// ============================================================================
// LIB MOCKS
// ============================================================================

export const createLibMocks = () => ({
  supabase: createSupabaseQueryMock(),
  getDeviceToken: vi.fn(() => "mock-device-token"),
  signInAnonymously: vi.fn(() => Promise.resolve({ user: createMockUser({ id: "anon-user-id" }), error: null })),
  getTodayLocalDate: vi.fn(() => new Date().toISOString().split("T")[0]),
  preloadDashboard: vi.fn(),
  jsDateToDatabaseDayOfWeek: vi.fn((jsDay: number) => (jsDay === 0 ? 6 : jsDay - 1)),
  toLocalDate: vi.fn((dateStr: string) => new Date(dateStr)),
  isClosedDay: vi.fn(() => false),
  findNextOpenDay: vi.fn(() => null),
  // Validation utilities
  validateEmail: vi.fn((email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return { isValid: false, error: "Email is required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }
    return { isValid: true };
  }),
  validatePassword: vi.fn((password: string) => {
    if (!password) return { isValid: false, error: "Password is required" };
    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters" };
    }
    return { isValid: true };
  }),
  validatePasswordMatch: vi.fn((password: string, confirm: string) => {
    if (password !== confirm) return { isValid: false, error: "Passwords do not match" };
    return { isValid: true };
  }),
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
});
