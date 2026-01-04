import { describe, it, expect } from "vitest";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  getPasswordRequirements,
  EMAIL_REGEX,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation";

describe("validation utilities", () => {
  describe("validateEmail", () => {
    it("returns valid for correct email format", () => {
      expect(validateEmail("test@example.com")).toEqual({ isValid: true });
      expect(validateEmail("user.name@domain.co.uk")).toEqual({ isValid: true });
      expect(validateEmail("user+tag@example.org")).toEqual({ isValid: true });
    });

    it("returns error for empty email", () => {
      expect(validateEmail("")).toEqual({
        isValid: false,
        error: "Email is required",
      });
      expect(validateEmail("   ")).toEqual({
        isValid: false,
        error: "Email is required",
      });
    });

    it("returns error for invalid email format", () => {
      expect(validateEmail("notanemail")).toEqual({
        isValid: false,
        error: "Please enter a valid email address",
      });
      expect(validateEmail("missing@domain")).toEqual({
        isValid: false,
        error: "Please enter a valid email address",
      });
      expect(validateEmail("@nodomain.com")).toEqual({
        isValid: false,
        error: "Please enter a valid email address",
      });
      expect(validateEmail("spaces in@email.com")).toEqual({
        isValid: false,
        error: "Please enter a valid email address",
      });
    });

    it("trims whitespace before validation", () => {
      expect(validateEmail("  test@example.com  ")).toEqual({ isValid: true });
    });
  });

  describe("validatePassword", () => {
    it("returns valid for password meeting all requirements", () => {
      expect(validatePassword("Password1")).toEqual({ isValid: true });
      expect(validatePassword("Abcdefgh1")).toEqual({ isValid: true });
      expect(validatePassword("MyPassword123")).toEqual({ isValid: true });
    });

    it("returns error for empty password", () => {
      expect(validatePassword("")).toEqual({
        isValid: false,
        error: "Password is required",
      });
    });

    it("returns error for password below minimum length", () => {
      expect(validatePassword("Pass1")).toEqual({
        isValid: false,
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
      expect(validatePassword("Abc123")).toEqual({
        isValid: false,
        error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    });

    it("returns error for password missing lowercase", () => {
      expect(validatePassword("PASSWORD1")).toEqual({
        isValid: false,
        error: "Password is too weak",
      });
    });

    it("returns error for password missing uppercase", () => {
      expect(validatePassword("password1")).toEqual({
        isValid: false,
        error: "Password is too weak",
      });
    });

    it("returns error for password missing digit", () => {
      expect(validatePassword("Password")).toEqual({
        isValid: false,
        error: "Password is too weak",
      });
    });
  });

  describe("getPasswordRequirements", () => {
    it("returns all false for empty password", () => {
      expect(getPasswordRequirements("")).toEqual({
        minLength: false,
        hasLowercase: false,
        hasUppercase: false,
        hasDigit: false,
      });
    });

    it("returns correct requirements for partial password", () => {
      expect(getPasswordRequirements("abc")).toEqual({
        minLength: false,
        hasLowercase: true,
        hasUppercase: false,
        hasDigit: false,
      });
    });

    it("returns all true for valid password", () => {
      expect(getPasswordRequirements("Password1")).toEqual({
        minLength: true,
        hasLowercase: true,
        hasUppercase: true,
        hasDigit: true,
      });
    });
  });

  describe("validatePasswordMatch", () => {
    it("returns valid when passwords match", () => {
      expect(validatePasswordMatch("password123", "password123")).toEqual({
        isValid: true,
      });
      expect(validatePasswordMatch("", "")).toEqual({ isValid: true });
    });

    it("returns error when passwords do not match", () => {
      expect(validatePasswordMatch("password123", "password456")).toEqual({
        isValid: false,
        error: "Passwords do not match",
      });
      expect(validatePasswordMatch("Password", "password")).toEqual({
        isValid: false,
        error: "Passwords do not match",
      });
    });
  });

  describe("constants", () => {
    it("EMAIL_REGEX matches valid emails", () => {
      expect(EMAIL_REGEX.test("test@example.com")).toBe(true);
      expect(EMAIL_REGEX.test("user@domain.co.uk")).toBe(true);
    });

    it("EMAIL_REGEX rejects invalid emails", () => {
      expect(EMAIL_REGEX.test("notanemail")).toBe(false);
      expect(EMAIL_REGEX.test("missing@")).toBe(false);
    });

    it("PASSWORD_MIN_LENGTH is 8", () => {
      expect(PASSWORD_MIN_LENGTH).toBe(8);
    });
  });
});
