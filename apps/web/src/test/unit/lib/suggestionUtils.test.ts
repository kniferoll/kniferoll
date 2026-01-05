import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateRecencyScore,
  calculateWeightedScore,
  rankSuggestions,
  formatQuantityDisplay,
} from "@/lib/suggestionUtils";

describe("suggestionUtils", () => {
  describe("calculateRecencyScore", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 0.2 for null lastUsed", () => {
      expect(calculateRecencyScore(null)).toBe(0.2);
    });

    it("returns 1.0 for items used today", () => {
      expect(calculateRecencyScore("2024-06-15")).toBe(1.0);
    });

    it("returns 0.8 for items used yesterday", () => {
      expect(calculateRecencyScore("2024-06-14")).toBe(0.8);
    });

    it("returns 0.5 for items used within the week", () => {
      expect(calculateRecencyScore("2024-06-10")).toBe(0.5);
      expect(calculateRecencyScore("2024-06-09")).toBe(0.5);
    });

    it("returns 0.2 for items used more than a week ago", () => {
      expect(calculateRecencyScore("2024-06-01")).toBe(0.2);
      expect(calculateRecencyScore("2024-01-01")).toBe(0.2);
    });
  });

  describe("calculateWeightedScore", () => {
    it("calculates weighted score with default max use count", () => {
      // (10/50) * 0.4 + 0.5 * 0.6 = 0.08 + 0.3 = 0.38
      expect(calculateWeightedScore(10, 0.5)).toBeCloseTo(0.38);
    });

    it("calculates weighted score with custom max use count", () => {
      // (20/100) * 0.4 + 0.8 * 0.6 = 0.08 + 0.48 = 0.56
      expect(calculateWeightedScore(20, 0.8, 100)).toBeCloseTo(0.56);
    });

    it("caps use count at max value", () => {
      // (50/50) * 0.4 + 1.0 * 0.6 = 0.4 + 0.6 = 1.0
      expect(calculateWeightedScore(100, 1.0, 50)).toBeCloseTo(1.0);
    });

    it("handles null use count", () => {
      // (0/50) * 0.4 + 0.5 * 0.6 = 0 + 0.3 = 0.3
      expect(calculateWeightedScore(null, 0.5)).toBeCloseTo(0.3);
    });

    it("handles zero use count", () => {
      // (0/50) * 0.4 + 1.0 * 0.6 = 0 + 0.6 = 0.6
      expect(calculateWeightedScore(0, 1.0)).toBeCloseTo(0.6);
    });
  });

  describe("rankSuggestions", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-06-15T12:00:00"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Minimal mock data - rankSuggestions only uses id, use_count, last_used, description
    const mockSuggestions = [
      {
        id: "1",
        description: "Carrots",
        use_count: 10,
        last_used: "2024-06-15",
      },
      {
        id: "2",
        description: "Onions",
        use_count: 5,
        last_used: "2024-06-10",
      },
      {
        id: "3",
        description: "Tomatoes",
        use_count: 50,
        last_used: "2024-01-01",
      },
    ] as Parameters<typeof rankSuggestions>[0];

    it("returns top N suggestions sorted by weighted score", () => {
      const result = rankSuggestions(mockSuggestions, new Set(), [], 2);
      expect(result.length).toBe(2);
      // First should be highest scored (Carrots - used today, decent count)
      expect(result[0].id).toBe("1");
    });

    it("excludes dismissed suggestions", () => {
      const dismissedIds = new Set(["1"]);
      const result = rankSuggestions(mockSuggestions, dismissedIds, [], 3);
      expect(result.find((s) => s.id === "1")).toBeUndefined();
      expect(result.length).toBe(2);
    });

    it("excludes suggestions already in current items", () => {
      const currentItems = [{ id: "item-1", description: "Carrots" }] as Array<{
        id: string;
        description: string;
      }>;
      const result = rankSuggestions(mockSuggestions, new Set(), currentItems as never, 3);
      expect(result.find((s) => s.description === "Carrots")).toBeUndefined();
    });

    it("returns all suggestions when topN is null", () => {
      const result = rankSuggestions(mockSuggestions, new Set(), [], null);
      expect(result.length).toBe(3);
    });

    it("includes recency and weighted scores in result", () => {
      const result = rankSuggestions(mockSuggestions, new Set(), [], 1);
      expect(result[0]).toHaveProperty("recencyScore");
      expect(result[0]).toHaveProperty("weightedScore");
      expect(result[0].dismissed).toBe(false);
    });

    it("handles empty suggestions array", () => {
      const result = rankSuggestions([], new Set(), [], 3);
      expect(result).toEqual([]);
    });

    it("is case-insensitive when filtering duplicates", () => {
      const currentItems = [{ id: "item-1", description: "CARROTS" }] as Array<{
        id: string;
        description: string;
      }>;
      const result = rankSuggestions(mockSuggestions, new Set(), currentItems as never, 3);
      expect(result.find((s) => s.description?.toLowerCase() === "carrots")).toBeUndefined();
    });
  });

  describe("formatQuantityDisplay", () => {
    it("returns empty string when both quantity and unit are empty", () => {
      expect(formatQuantityDisplay(null, null)).toBe("");
      expect(formatQuantityDisplay(null, undefined)).toBe("");
    });

    it("returns formatted string with quantity and unit", () => {
      expect(formatQuantityDisplay(5, "lbs")).toBe("5 lbs");
      expect(formatQuantityDisplay(2.5, "kg")).toBe("2.5 kg");
    });

    it("returns just unit when quantity is null", () => {
      expect(formatQuantityDisplay(null, "each")).toBe("each");
    });

    it("returns just quantity when unit is null", () => {
      expect(formatQuantityDisplay(10, null)).toBe("10");
      expect(formatQuantityDisplay(3, undefined)).toBe("3");
    });

    it("handles zero quantity", () => {
      // 0 is falsy, should return empty string
      expect(formatQuantityDisplay(0, null)).toBe("");
      expect(formatQuantityDisplay(0, "lbs")).toBe("lbs");
    });
  });
});
