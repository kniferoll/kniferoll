/* eslint-disable react-refresh/only-export-components */
/**
 * Test providers and comprehensive mocks for Kniferoll
 *
 * This file sets up all necessary mocks and providers for testing pages
 * that require data from Supabase, Zustand stores, and custom hooks.
 */
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { HeaderProvider } from "@/context/HeaderContext";
import { DarkModeProvider } from "@/context/DarkModeContext";
import {
  defaultMockData,
  createMockKitchenStore,
  createMockPrepStore,
  createMockPrepEntryStore,
} from "./mocks";

// ============================================================================
// AUTH STATE CONTROL
// ============================================================================

/**
 * Global flag to control auth state in tests.
 * Set to true for authenticated page tests, false for public page tests.
 * Call setTestAuthState(true/false) in beforeEach to configure.
 */
let testAuthenticatedUser = false;

export function setTestAuthState(authenticated: boolean) {
  testAuthenticatedUser = authenticated;
}

function getTestAuthStore() {
  if (testAuthenticatedUser) {
    return {
      user: defaultMockData.user,
      session: defaultMockData.session,
      loading: false,
      initialized: true,
      initialize: vi.fn(),
      signIn: vi.fn(() => Promise.resolve({ error: undefined })),
      signUp: vi.fn(() => Promise.resolve({ error: undefined })),
      signOut: vi.fn(() => Promise.resolve()),
      resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: undefined })),
      updatePassword: vi.fn(() => Promise.resolve({ error: undefined })),
      refreshUser: vi.fn(() => Promise.resolve()),
    };
  }
  return {
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
  };
}

// ============================================================================
// MOCK: useDarkMode hook (required by DarkModeProvider)
// ============================================================================
vi.mock("@/hooks/useDarkMode", () => ({
  useDarkMode: vi.fn(() => ({
    isDark: false,
    toggle: vi.fn(),
  })),
}));

// ============================================================================
// MOCK: Supabase client with comprehensive query support
// ============================================================================

/**
 * Creates a chainable query mock for a specific table's data.
 * All chain methods (select, eq, order, etc.) return the same chain object
 * so that single()/maybeSingle() always have access to the correct data.
 */
const createTableQueryChain = (tableData: unknown) => {
  const chain: Record<string, unknown> = {};

  // Chain methods - all return the same chain to maintain data context
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.range = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lt = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.like = vi.fn(() => chain);
  chain.ilike = vi.fn(() => chain);
  chain.is = vi.fn(() => chain);
  chain.contains = vi.fn(() => chain);
  chain.containedBy = vi.fn(() => chain);

  // Terminal methods - return the actual data
  chain.single = vi.fn(() => {
    const result = Array.isArray(tableData) ? tableData[0] : tableData;
    return Promise.resolve({ data: result ?? null, error: null });
  });

  chain.maybeSingle = vi.fn(() => {
    const result = Array.isArray(tableData) ? tableData[0] : tableData;
    return Promise.resolve({ data: result ?? null, error: null });
  });

  // For awaiting arrays directly (no single/maybeSingle)
  chain.then = (
    resolve: (value: { data: unknown; error: null }) => void,
    reject?: (reason: unknown) => void
  ) => {
    try {
      const result = Array.isArray(tableData) ? tableData : tableData ? [tableData] : [];
      resolve({ data: result, error: null });
    } catch (err) {
      if (reject) reject(err);
    }
  };

  return chain;
};

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: defaultMockData.session }, error: null })
      ),
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: defaultMockData.user }, error: null })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: { session: defaultMockData.session, user: defaultMockData.user },
          error: null,
        })
      ),
      signUp: vi.fn(() =>
        Promise.resolve({
          data: { session: defaultMockData.session, user: defaultMockData.user },
          error: null,
        })
      ),
      updateUser: vi.fn(() =>
        Promise.resolve({ data: { user: defaultMockData.user }, error: null })
      ),
    },
    from: vi.fn((table: string) => {
      // Map table names to mock data
      const tableDataMap: Record<string, unknown> = {
        kitchens: defaultMockData.kitchen,
        stations: defaultMockData.stations,
        kitchen_members: defaultMockData.members,
        invite_links: defaultMockData.inviteLink,
        prep_items: defaultMockData.prepItems,
        kitchen_shifts: defaultMockData.shifts,
        kitchen_shift_days: defaultMockData.shiftDays,
        kitchen_units: defaultMockData.units,
      };

      const tableData = tableDataMap[table];
      const chain = createTableQueryChain(tableData);

      return {
        ...chain,
        insert: vi.fn(() => {
          const insertChain = createTableQueryChain(tableData);
          return insertChain;
        }),
        update: vi.fn(() => {
          const updateChain = createTableQueryChain(tableData);
          return updateChain;
        }),
        delete: vi.fn(() => {
          const deleteChain = createTableQueryChain(null);
          return deleteChain;
        }),
        upsert: vi.fn(() => {
          const upsertChain = createTableQueryChain(tableData);
          return upsertChain;
        }),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
  },
  getDeviceToken: vi.fn(() => "mock-device-token"),
  signInAnonymously: vi.fn(() =>
    Promise.resolve({ user: { ...defaultMockData.user, id: "anon-user-id" }, error: null })
  ),
}));

// ============================================================================
// MOCK: Lib barrel export (@/lib)
// ============================================================================

// Helper to create supabase mock for @/lib (uses same table chain pattern)
const createLibSupabaseMock = () => {
  const tableDataMap: Record<string, unknown> = {
    kitchens: defaultMockData.kitchen,
    stations: defaultMockData.stations,
    kitchen_members: defaultMockData.members,
    invite_links: defaultMockData.inviteLink,
    prep_items: defaultMockData.prepItems,
    kitchen_shifts: defaultMockData.shifts,
    kitchen_shift_days: defaultMockData.shiftDays,
    kitchen_units: defaultMockData.units,
  };

  return {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: defaultMockData.session }, error: null })
      ),
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: defaultMockData.user }, error: null })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      signInWithPassword: vi.fn(() =>
        Promise.resolve({
          data: { session: defaultMockData.session, user: defaultMockData.user },
          error: null,
        })
      ),
      signUp: vi.fn(() =>
        Promise.resolve({
          data: { session: defaultMockData.session, user: defaultMockData.user },
          error: null,
        })
      ),
      updateUser: vi.fn(() =>
        Promise.resolve({ data: { user: defaultMockData.user }, error: null })
      ),
    },
    from: vi.fn((table: string) => {
      const tableData = tableDataMap[table];
      const chain = createTableQueryChain(tableData);
      return {
        ...chain,
        insert: vi.fn(() => createTableQueryChain(tableData)),
        update: vi.fn(() => createTableQueryChain(tableData)),
        delete: vi.fn(() => createTableQueryChain(null)),
        upsert: vi.fn(() => createTableQueryChain(tableData)),
      };
    }),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
    removeChannel: vi.fn(),
  };
};

vi.mock("@/lib", () => ({
  // supabase
  supabase: createLibSupabaseMock(),
  getDeviceToken: vi.fn(() => "mock-device-token"),
  signInAnonymously: vi.fn(() =>
    Promise.resolve({ user: { ...defaultMockData.user, id: "anon-user-id" }, error: null })
  ),

  // storage
  safeGetItem: vi.fn((key: string) => localStorage.getItem(key)),
  safeSetItem: vi.fn((key: string, value: string) => {
    localStorage.setItem(key, value);
    return true;
  }),
  safeRemoveItem: vi.fn((key: string) => {
    localStorage.removeItem(key);
    return true;
  }),

  // dateUtils
  getTodayLocalDate: vi.fn(() => new Date().toISOString().split("T")[0]),
  toLocalDate: vi.fn((dateStr: string) => new Date(dateStr + "T12:00:00")),
  formatToDateString: vi.fn((date: Date) => date.toISOString().split("T")[0]),
  jsDateToDatabaseDayOfWeek: vi.fn((jsDay: number) => (jsDay + 6) % 7),
  databaseDayOfWeekToJsDate: vi.fn((dbDay: number) => (dbDay + 1) % 7),
  findNextOpenDay: vi.fn(() => null),
  isClosedDay: vi.fn(() => false),

  // entitlements
  getUserLimits: vi.fn(() => ({
    maxKitchens: 5,
    maxStationsPerKitchen: 999,
    canInviteAsOwner: true,
    plan: "pro",
  })),

  // stripe
  getStripe: vi.fn(() => Promise.resolve(null)),

  // suggestionUtils
  filterSuggestions: vi.fn(() => []),
  rankSuggestions: vi.fn(() => []),

  // sentry
  captureError: vi.fn(),
  initSentry: vi.fn(),
  setSentryUser: vi.fn(),

  // validation
  validateEmail: vi.fn((email: string) => {
    const trimmed = email.trim();
    if (!trimmed) return { isValid: false, error: "Email is required" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return { isValid: false, error: "Please enter a valid email address" };
    }
    return { isValid: true };
  }),
  getPasswordRequirements: vi.fn((password: string) => ({
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
  })),
  validatePassword: vi.fn((password: string) => {
    if (!password) return { isValid: false, error: "Password is required" };
    if (password.length < 8) {
      return { isValid: false, error: "Password must be at least 8 characters" };
    }
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    if (!hasLowercase || !hasUppercase || !hasDigit) {
      return { isValid: false, error: "Password is too weak" };
    }
    return { isValid: true };
  }),
  validatePasswordMatch: vi.fn((password: string, confirm: string) => {
    if (password !== confirm) return { isValid: false, error: "Passwords do not match" };
    return { isValid: true };
  }),
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
}));

// ============================================================================
// MOCK: Preload module
// ============================================================================
vi.mock("@/lib/preload", () => ({
  preloadDashboard: vi.fn(),
  preloadKitchenDashboard: vi.fn(),
  preloadStationView: vi.fn(),
  preloadLogin: vi.fn(),
  preloadSignup: vi.fn(),
}));

// ============================================================================
// MOCK: Stripe
// ============================================================================
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn(() => Promise.resolve(null)),
}));

// ============================================================================
// MOCK: Zustand stores
// ============================================================================
vi.mock("@/stores", () => ({
  useAuthStore: vi.fn((selector) => {
    // Uses dynamic getTestAuthStore() so auth state can be changed per test
    const store = getTestAuthStore();
    return selector ? selector(store) : store;
  }),
  useKitchenStore: Object.assign(
    vi.fn((selector) => {
      const store = createMockKitchenStore();
      return selector ? selector(store) : store;
    }),
    {
      getState: vi.fn(() => createMockKitchenStore()),
    }
  ),
  usePrepStore: vi.fn((selector) => {
    const store = createMockPrepStore();
    return selector ? selector(store) : store;
  }),
  usePrepEntryStore: vi.fn((selector) => {
    const store = createMockPrepEntryStore();
    return selector ? selector(store) : store;
  }),
  useOfflineStore: vi.fn(() => ({
    isOnline: true,
    pendingActions: [],
  })),
}));

// ============================================================================
// MOCK: Custom hooks
// ============================================================================
vi.mock("@/hooks", () => ({
  useDarkMode: vi.fn(() => ({
    isDark: false,
    toggle: vi.fn(),
  })),
  useHeader: vi.fn(() => ({
    config: null,
    setConfig: vi.fn(),
  })),
  useHeaderConfig: vi.fn(),
  useInviteLinks: vi.fn(() => ({
    inviteLinks: [],
    loading: false,
    error: null,
    createInviteLink: vi.fn(() => Promise.resolve(defaultMockData.inviteLink)),
    revokeInviteLink: vi.fn(() => Promise.resolve()),
  })),
  useItemSuggestions: vi.fn(() => ({
    suggestions: [],
    loading: false,
  })),
  useKitchenShifts: vi.fn(() => ({
    shifts: defaultMockData.shifts,
    shiftDays: defaultMockData.shiftDays,
    loading: false,
  })),
  useKitchenShiftActions: vi.fn(() => ({
    addShift: vi.fn(() => Promise.resolve()),
    updateShift: vi.fn(() => Promise.resolve()),
    deleteShift: vi.fn(() => Promise.resolve()),
    updateShiftDay: vi.fn(() => Promise.resolve()),
    loading: false,
    error: null,
  })),
  DAYS_OF_WEEK: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  useKitchenUnits: vi.fn(() => ({
    units: defaultMockData.units,
    loading: false,
  })),
  useKitchens: vi.fn(() => ({
    kitchens: [defaultMockData.kitchen],
    loading: false,
    error: null,
  })),
  useKitchen: vi.fn(() => ({
    kitchen: defaultMockData.kitchen,
    members: defaultMockData.members,
    loading: false,
    error: null,
  })),
  useMemberActions: vi.fn(() => ({
    removeMember: vi.fn(() => Promise.resolve()),
    updateMemberRole: vi.fn(() => Promise.resolve()),
    loading: false,
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
  usePrepItemActions: vi.fn(() => ({
    addPrepItem: vi.fn(() => Promise.resolve()),
    updatePrepItem: vi.fn(() => Promise.resolve()),
    deletePrepItem: vi.fn(() => Promise.resolve()),
    loading: false,
  })),
  usePrepItems: vi.fn(() => ({
    prepItems: defaultMockData.prepItems,
    loading: false,
    error: null,
  })),
  useRealtimeMembers: vi.fn(() => ({
    members: defaultMockData.members,
    loading: false,
  })),
  useRealtimePrepItems: vi.fn(),
  useRealtimeStations: vi.fn(),
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
  useStripeCheckout: vi.fn(() => ({
    handleCheckout: vi.fn(() => Promise.resolve()),
    loading: false,
  })),
  useUserSubscription: vi.fn(() => ({
    profile: { plan: "pro", stripe_customer_id: "cus_test", subscription_period_end: null },
    loading: false,
  })),
  useVisualViewport: vi.fn(() => ({
    keyboardOffset: 0,
    viewportHeight: 800,
  })),
}));

// ============================================================================
// TEST PROVIDERS
// ============================================================================

interface TestProvidersProps {
  children: ReactNode;
  initialRoute?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function TestProviders({ children, initialRoute = "/" }: TestProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>
          <HeaderProvider>{children}</HeaderProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </DarkModeProvider>
  );
}
