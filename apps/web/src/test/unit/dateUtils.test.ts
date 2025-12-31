import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getTodayLocalDate,
  toLocalDate,
  formatToDateString,
  jsDateToDatabaseDayOfWeek,
  databaseDayOfWeekToJsDate,
  findNextOpenDay,
  isClosedDay,
} from "@/lib/dateUtils";

describe("dateUtils", () => {
  describe("getTodayLocalDate", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns today's date in YYYY-MM-DD format", () => {
      vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
      expect(getTodayLocalDate()).toBe("2024-06-15");
    });

    it("pads single-digit months with zero", () => {
      vi.setSystemTime(new Date(2024, 0, 5)); // January 5, 2024
      expect(getTodayLocalDate()).toBe("2024-01-05");
    });

    it("pads single-digit days with zero", () => {
      vi.setSystemTime(new Date(2024, 11, 1)); // December 1, 2024
      expect(getTodayLocalDate()).toBe("2024-12-01");
    });
  });

  describe("toLocalDate", () => {
    it("creates a date object from YYYY-MM-DD string", () => {
      const date = toLocalDate("2024-06-15");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(5); // 0-indexed
      expect(date.getDate()).toBe(15);
    });

    it("handles start of year", () => {
      const date = toLocalDate("2024-01-01");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
    });

    it("handles end of year", () => {
      const date = toLocalDate("2024-12-31");
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(31);
    });
  });

  describe("formatToDateString", () => {
    it("formats a date as YYYY-MM-DD", () => {
      const date = new Date(2024, 5, 15);
      expect(formatToDateString(date)).toBe("2024-06-15");
    });

    it("pads single-digit months and days", () => {
      const date = new Date(2024, 0, 5);
      expect(formatToDateString(date)).toBe("2024-01-05");
    });
  });

  describe("jsDateToDatabaseDayOfWeek", () => {
    it("converts Sunday (JS 0) to database 6", () => {
      expect(jsDateToDatabaseDayOfWeek(0)).toBe(6);
    });

    it("converts Monday (JS 1) to database 0", () => {
      expect(jsDateToDatabaseDayOfWeek(1)).toBe(0);
    });

    it("converts Tuesday (JS 2) to database 1", () => {
      expect(jsDateToDatabaseDayOfWeek(2)).toBe(1);
    });

    it("converts Saturday (JS 6) to database 5", () => {
      expect(jsDateToDatabaseDayOfWeek(6)).toBe(5);
    });
  });

  describe("databaseDayOfWeekToJsDate", () => {
    it("converts database 0 (Monday) to JS 1", () => {
      expect(databaseDayOfWeekToJsDate(0)).toBe(1);
    });

    it("converts database 6 (Sunday) to JS 0", () => {
      expect(databaseDayOfWeekToJsDate(6)).toBe(0);
    });

    it("converts database 5 (Saturday) to JS 6", () => {
      expect(databaseDayOfWeekToJsDate(5)).toBe(6);
    });
  });

  describe("findNextOpenDay", () => {
    it("returns the next open day excluding today by default", () => {
      // Create a shift map where Tuesday (db: 1) is open
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: i === 1, shift_ids: i === 1 ? ["shift-1"] : [] });
      }

      // From Monday (db: 0), next open day should be Tuesday
      const result = findNextOpenDay("2024-06-17", shiftDays); // June 17, 2024 is Monday
      expect(result).toBe("2024-06-18"); // Tuesday
    });

    it("includes today when includeToday is true", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: i === 0, shift_ids: i === 0 ? ["shift-1"] : [] }); // Monday open
      }

      // June 17, 2024 is Monday (db: 0), which is open
      const result = findNextOpenDay("2024-06-17", shiftDays, true);
      expect(result).toBe("2024-06-17"); // Same day
    });

    it("returns null when no open days within a week", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: false, shift_ids: [] }); // All closed
      }

      const result = findNextOpenDay("2024-06-17", shiftDays);
      expect(result).toBe(null);
    });

    it("wraps around to next week correctly", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: i === 0, shift_ids: i === 0 ? ["shift-1"] : [] }); // Only Monday open
      }

      // June 18, 2024 is Tuesday. Next Monday is June 24
      const result = findNextOpenDay("2024-06-18", shiftDays);
      expect(result).toBe("2024-06-24");
    });
  });

  describe("isClosedDay", () => {
    it("returns true when day is not open", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: i !== 0, shift_ids: [] }); // Monday closed
      }

      // June 17, 2024 is Monday (db: 0)
      expect(isClosedDay("2024-06-17", shiftDays)).toBe(true);
    });

    it("returns false when day is open", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      for (let i = 0; i <= 6; i++) {
        shiftDays.set(i, { is_open: i === 0, shift_ids: i === 0 ? ["shift-1"] : [] }); // Monday open
      }

      expect(isClosedDay("2024-06-17", shiftDays)).toBe(false);
    });

    it("returns false when no config found for day", () => {
      const shiftDays = new Map<number, { is_open: boolean; shift_ids: string[] }>();
      // Empty map, no config for any day

      expect(isClosedDay("2024-06-17", shiftDays)).toBe(false);
    });
  });
});
