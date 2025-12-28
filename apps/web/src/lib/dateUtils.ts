/**
 * Get today's date as YYYY-MM-DD in local timezone (not UTC)
 */
export function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Create a date object from YYYY-MM-DD string, treating it as local time
 */
export function toLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date;
}

/**
 * Format a date object as YYYY-MM-DD
 */
export function formatToDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Convert JavaScript's getDay() (Sun=0, Mon=1, ..., Sat=6)
 * to database format (Mon=0, Tue=1, ..., Sun=6 - ISO 8601)
 */
export function jsDateToDatabaseDayOfWeek(jsDay: number): number {
  // JS: Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  // DB: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
  // Convert: (jsDay + 6) % 7
  return (jsDay + 6) % 7;
}

/**
 * Convert database day-of-week format (Mon=0, Tue=1, ..., Sun=6 - ISO 8601)
 * to JavaScript's getDay() (Sun=0, Mon=1, ..., Sat=6)
 */
export function databaseDayOfWeekToJsDate(dbDay: number): number {
  // Reverse of above: (dbDay + 1) % 7
  return (dbDay + 1) % 7;
}
