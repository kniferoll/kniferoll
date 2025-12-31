/**
 * Centralized performance budget configuration.
 * Start with generous budgets based on current behavior, tighten over time.
 *
 * renders: Maximum number of renders allowed
 * duration: Maximum total render duration in milliseconds
 */

export const RENDER_BUDGETS = {
  // Page mounts
  Dashboard: { renders: 10, duration: 100 },
  InviteJoin: { renders: 8, duration: 80 },
  JoinWithCode: { renders: 8, duration: 80 },
  KitchenDashboard: { renders: 10, duration: 100 },
  KitchenSettings: { renders: 10, duration: 100 },
  Landing: { renders: 8, duration: 80 },
  Login: { renders: 6, duration: 60 },
  Signup: { renders: 6, duration: 60 },
  StationView: { renders: 12, duration: 120 },

  // Interactions
  "toggle-prep-item": { renders: 4, duration: 40 },
  "open-modal": { renders: 4, duration: 40 },
  "close-modal": { renders: 4, duration: 40 },
  "submit-form": { renders: 6, duration: 60 },
  "navigate-tab": { renders: 4, duration: 40 },
} as const;

export type BudgetName = keyof typeof RENDER_BUDGETS;

// Pages excluded from budget coverage tests (static content, no perf concern)
export const EXCLUDED_PAGES = ["PrivacyPolicy", "TermsOfService"] as const;

/**
 * Get budget for a specific page or interaction.
 * Throws if budget is not defined.
 */
export function getBudget(name: BudgetName): { renders: number; duration: number } {
  const budget = RENDER_BUDGETS[name];
  if (!budget) {
    throw new Error(`No budget defined for: ${name}`);
  }
  return budget;
}
