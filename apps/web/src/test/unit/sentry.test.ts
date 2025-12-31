import { describe, it, expect, vi, beforeEach } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  captureException: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
}));

// Import after mocking
import { initSentry, setSentryUser, captureError } from "@/lib/sentry";

describe("sentry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initSentry", () => {
    it("does not initialize Sentry in non-production mode", () => {
      // By default, import.meta.env.PROD is false in tests
      initSentry();

      expect(Sentry.init).not.toHaveBeenCalled();
    });
  });

  describe("setSentryUser", () => {
    it("sets user context when userId is provided", () => {
      setSentryUser("user-123");

      expect(Sentry.setUser).toHaveBeenCalledWith({ id: "user-123" });
    });

    it("clears user context when userId is null", () => {
      setSentryUser(null);

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });

  describe("captureError", () => {
    it("captures error with Sentry", () => {
      const error = new Error("Test error");

      captureError(error);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: undefined });
    });

    it("captures error with additional context", () => {
      const error = new Error("Test error");
      const context = { userId: "user-123", action: "saveData" };

      captureError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: context });
    });
  });
});
