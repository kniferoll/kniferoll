export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 8;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
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

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      isValid: false,
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
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
