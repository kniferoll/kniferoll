/**
 * Centralized performance budget configuration.
 * Start with generous budgets based on current behavior, tighten over time.
 *
 * renders: Maximum number of renders allowed
 * duration: Maximum total render duration in milliseconds
 */

/**
 * Page mount budgets
 * These correspond to pages in src/pages/
 */
export const PAGE_BUDGETS = {
  Dashboard: { renders: 10, duration: 100 },
  ForgotPassword: { renders: 6, duration: 60 },
  InviteJoin: { renders: 8, duration: 80 },
  JoinWithCode: { renders: 8, duration: 80 },
  KitchenDashboard: { renders: 15, duration: 150 },
  Landing: { renders: 8, duration: 80 },
  Login: { renders: 6, duration: 60 },
  ResetPassword: { renders: 6, duration: 60 },
  Settings: { renders: 12, duration: 120 },
  Signup: { renders: 6, duration: 100 },
  StationView: { renders: 15, duration: 150 },
  VerifyEmail: { renders: 6, duration: 60 },
} as const;

/**
 * Component budgets
 * These measure render performance of individual components
 */
export const COMPONENT_BUDGETS = {
  // Prep components
  PrepItemList: { renders: 4, duration: 50 },
  ProgressBar: { renders: 2, duration: 20 },

  // Kitchen components
  ShiftToggle: { renders: 2, duration: 20 },
  DateCalendar: { renders: 3, duration: 350 },

  // UI primitives
  Button: { renders: 2, duration: 10 },
  Card: { renders: 2, duration: 10 },
  Modal: { renders: 3, duration: 30 },
  FormInput: { renders: 2, duration: 15 },
  Tabs: { renders: 2, duration: 20 },
  EmptyState: { renders: 2, duration: 15 },
} as const;

/**
 * Interaction budgets
 * These measure render impact of user interactions
 */
export const INTERACTION_BUDGETS = {
  "toggle-prep-item": { renders: 4, duration: 40 },
  "open-modal": { renders: 4, duration: 40 },
  "close-modal": { renders: 4, duration: 40 },
  "submit-form": { renders: 6, duration: 60 },
  "navigate-tab": { renders: 4, duration: 40 },
  "form-input": { renders: 3, duration: 30 },
} as const;

/**
 * Combined budgets for backwards compatibility
 */
export const RENDER_BUDGETS = {
  ...PAGE_BUDGETS,
  ...COMPONENT_BUDGETS,
  ...INTERACTION_BUDGETS,
} as const;

export type PageBudgetName = keyof typeof PAGE_BUDGETS;
export type ComponentBudgetName = keyof typeof COMPONENT_BUDGETS;
export type InteractionBudgetName = keyof typeof INTERACTION_BUDGETS;
export type BudgetName = keyof typeof RENDER_BUDGETS;

/**
 * Pages excluded from budget coverage tests (static content, no perf concern)
 */
export const EXCLUDED_PAGES = [
  "HelpCenter",
  "NotFound",
  "Pricing",
  "PrivacyPolicy",
  "TermsOfService",
] as const;

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

/**
 * Check if a name is a page budget (for coverage enforcement)
 */
export function isPageBudget(name: string): name is PageBudgetName {
  return name in PAGE_BUDGETS;
}
