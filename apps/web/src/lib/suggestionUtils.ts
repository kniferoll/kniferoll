import type {
  DbPrepItemSuggestion,
  RecencyScoredSuggestion,
  DbPrepItem,
} from "@kniferoll/types";

/**
 * Calculate recency score based on when the item was last used
 * 1.0 if used today, 0.8 yesterday, 0.5 this week, 0.2 older
 */
export function calculateRecencyScore(lastUsed: string | null): number {
  if (!lastUsed) return 0.2;

  const lastUsedDate = new Date(lastUsed);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor(
    (today.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysDiff === 0) return 1.0; // Today
  if (daysDiff === 1) return 0.8; // Yesterday
  if (daysDiff <= 7) return 0.5; // This week
  return 0.2; // Older
}

/**
 * Calculate weighted score for a suggestion
 * Score = (use_count * 0.4) + (recencyScore * 0.6)
 * Normalized by dividing use_count by a reasonable max (e.g., 50) to keep scores in similar ranges
 */
export function calculateWeightedScore(
  useCount: number | null,
  recencyScore: number,
  maxUseCount: number = 50
): number {
  const normalizedUseCount = Math.min((useCount || 0) / maxUseCount, 1.0);
  return normalizedUseCount * 0.4 + recencyScore * 0.6;
}

/**
 * Check if an item description matches an existing prep item
 * Case-insensitive comparison
 */
function isSuggestionAlreadyInList(
  suggestionDesc: string,
  currentItems: (DbPrepItem & { description?: string })[]
): boolean {
  const normalizedSuggestion = suggestionDesc.toLowerCase().trim();
  return currentItems.some(
    (item) =>
      (item.description || "").toLowerCase().trim() === normalizedSuggestion
  );
}

/**
 * Score and rank suggestions, returning top N non-dismissed suggestions
 * Excludes suggestions for items already on the current list
 */
export function rankSuggestions(
  suggestions: (DbPrepItemSuggestion & { description?: string })[],
  dismissedIds: Set<string>,
  currentItems: (DbPrepItem & { description?: string })[] = [],
  topN: number | null = 3
): RecencyScoredSuggestion[] {
  // Calculate max use_count for normalization
  const maxUseCount =
    Math.max(
      ...(suggestions.map((s) => s.use_count || 0) || []),
      50 // Default max if empty
    ) || 50;

  // Score and filter non-dismissed and non-duplicate suggestions
  const scored = suggestions
    .filter((s) => !dismissedIds.has(s.id))
    .filter(
      (s) => !isSuggestionAlreadyInList(s.description || "", currentItems)
    )
    .map((s) => {
      const recencyScore = calculateRecencyScore(s.last_used);
      const weightedScore = calculateWeightedScore(
        s.use_count,
        recencyScore,
        maxUseCount
      );

      return {
        ...s,
        recencyScore,
        weightedScore,
        dismissed: false,
      };
    });

  // Sort by weighted score descending
  scored.sort((a, b) => b.weightedScore - a.weightedScore);

  // Return top N (or all if topN is null)
  return topN !== null ? scored.slice(0, topN) : scored;
}

/**
 * Format quantity display string
 */
export function formatQuantityDisplay(
  quantity: number | null,
  unitName: string | null | undefined
): string {
  if (!quantity && !unitName) return "";
  if (quantity && unitName) return `${quantity} ${unitName}`;
  if (unitName) return unitName;
  if (quantity) return quantity.toString();
  return "";
}
