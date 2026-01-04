export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface PasswordRequirements {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigit: boolean;
}

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { isValid: false, error: "Email is required" };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }
  return { isValid: true };
}

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= PASSWORD_MIN_LENGTH,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
  };
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  const requirements = getPasswordRequirements(password);

  if (!requirements.minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }

  if (!requirements.hasLowercase || !requirements.hasUppercase || !requirements.hasDigit) {
    return {
      isValid: false,
      error: "Password is too weak",
    };
  }

  return { isValid: true };
}

export function validatePasswordMatch(
  password: string,
  confirm: string
): ValidationResult {
  if (password !== confirm) {
    return { isValid: false, error: "Passwords do not match" };
  }
  return { isValid: true };
}
