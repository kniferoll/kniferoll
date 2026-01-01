import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("supabase", () => {
  describe("getDeviceToken", () => {
    let originalLocalStorage: Storage;
    let mockStorage: Record<string, string>;

    beforeEach(() => {
      vi.resetModules();
      mockStorage = {};

      // Save original localStorage
      originalLocalStorage = window.localStorage;

      // Create a mock localStorage
      const mockLocalStorage = {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
        length: 0,
        key: vi.fn(() => null),
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      // Mock the createClient and environment
      vi.doMock("@supabase/supabase-js", () => ({
        createClient: vi.fn(() => ({
          from: vi.fn(),
          auth: { getUser: vi.fn() },
        })),
      }));

      // Set up environment mocks
      vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");
      vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-key");
    });

    afterEach(() => {
      // Restore original localStorage
      Object.defineProperty(window, "localStorage", {
        value: originalLocalStorage,
        writable: true,
      });
      vi.restoreAllMocks();
      vi.unstubAllEnvs();
    });

    it("returns existing token from localStorage if available", async () => {
      const existingToken = "existing-device-token";
      mockStorage["kniferoll_device_token"] = existingToken;

      const { getDeviceToken } = await import("@/lib/supabase");
      const token = getDeviceToken();

      expect(token).toBe(existingToken);
    });

    it("generates new token and stores it if none exists", async () => {
      const { getDeviceToken } = await import("@/lib/supabase");
      const token = getDeviceToken();

      // Token should be a UUID format
      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "kniferoll_device_token",
        token
      );
    });

    it("stores token in localStorage when generating new one", async () => {
      const { getDeviceToken } = await import("@/lib/supabase");

      getDeviceToken();

      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        "kniferoll_device_token",
        expect.any(String)
      );
    });
  });
});
