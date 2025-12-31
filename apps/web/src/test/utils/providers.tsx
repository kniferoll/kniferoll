import React, { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import { HeaderProvider } from "@/context/HeaderContext";
import { DarkModeProvider } from "@/context/DarkModeContext";

// Mock useDarkMode hook that DarkModeProvider depends on
vi.mock("@/hooks/useDarkMode", () => ({
  useDarkMode: vi.fn(() => ({
    isDark: false,
    toggle: vi.fn(),
  })),
}));

// Mock Supabase client
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          order: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
        order: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    }),
    removeChannel: vi.fn(),
  },
  getDeviceToken: vi.fn().mockReturnValue("mock-device-token"),
}));

// Mock Stripe (if used in the app)
vi.mock("@stripe/stripe-js", () => ({
  loadStripe: vi.fn().mockResolvedValue(null),
}));

interface TestProvidersProps {
  children: ReactNode;
  initialRoute?: string;
}

// Create a fresh QueryClient for each test
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

// Note: renderWithProviders utility is available but not currently used
// If needed, import render from @testing-library/react and use:
// render(ui, { wrapper: TestProviders })
