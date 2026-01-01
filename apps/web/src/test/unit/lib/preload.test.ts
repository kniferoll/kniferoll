import { describe, it, expect, vi } from "vitest";

// Mock dynamic imports
vi.mock("@/pages/Dashboard", () => ({ default: "Dashboard" }));
vi.mock("@/pages/KitchenDashboard", () => ({ default: "KitchenDashboard" }));
vi.mock("@/pages/StationView", () => ({ default: "StationView" }));
vi.mock("@/pages/Login", () => ({ default: "Login" }));
vi.mock("@/pages/Signup", () => ({ default: "Signup" }));

import {
  preloadDashboard,
  preloadKitchenDashboard,
  preloadStationView,
  preloadLogin,
  preloadSignup,
} from "@/lib/preload";

describe("preload", () => {
  describe("preloadDashboard", () => {
    it("returns a promise that resolves to the Dashboard module", async () => {
      const result = await preloadDashboard();
      expect(result).toEqual({ default: "Dashboard" });
    });
  });

  describe("preloadKitchenDashboard", () => {
    it("returns a promise that resolves to the KitchenDashboard module", async () => {
      const result = await preloadKitchenDashboard();
      expect(result).toEqual({ default: "KitchenDashboard" });
    });
  });

  describe("preloadStationView", () => {
    it("returns a promise that resolves to the StationView module", async () => {
      const result = await preloadStationView();
      expect(result).toEqual({ default: "StationView" });
    });
  });

  describe("preloadLogin", () => {
    it("returns a promise that resolves to the Login module", async () => {
      const result = await preloadLogin();
      expect(result).toEqual({ default: "Login" });
    });
  });

  describe("preloadSignup", () => {
    it("returns a promise that resolves to the Signup module", async () => {
      const result = await preloadSignup();
      expect(result).toEqual({ default: "Signup" });
    });
  });
});
