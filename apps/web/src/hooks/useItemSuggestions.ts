import { useState, useEffect } from "react";
import { supabase } from "@/lib";
import type { DbPrepItemSuggestion } from "@kniferoll/types";

type KitchenItemSuggestion = DbPrepItemSuggestion & { description?: string };

// Type for suggestion with joined kitchen_items
interface SuggestionWithJoin extends DbPrepItemSuggestion {
  kitchen_items: { name: string } | null;
}

interface RankedSuggestion extends KitchenItemSuggestion {
  score: number;
}

/**
 * Hook for autocomplete suggestions with ranking algorithm
 *
 * Ranking formula:
 * score = (station_shift_match * 10) + (station_match * 5) + (use_count * 0.5) + (recency_days * -0.1)
 *
 * Where:
 * - station_shift_match: item was used on this station + this shift before (1 or 0)
 * - station_match: item was used on this station (any shift) (1 or 0)
 * - use_count: total times used
 * - recency_days: days since last used (negative score for older items)
 */
export function useItemSuggestions(
  _kitchenId: string | undefined,
  stationId: string | undefined,
  shiftId: string | undefined,
  searchQuery: string = ""
) {
  const [suggestions, setSuggestions] = useState<RankedSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId || !shiftId) {
      setSuggestions([]);
      return;
    }

    const loadSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch suggestions for this station/shift
        const { data: allSuggestions, error: err } = await supabase
          .from("prep_item_suggestions")
          .select("*, kitchen_items(name)")
          .eq("station_id", stationId)
          .eq("shift_id", shiftId)
          .order("use_count", { ascending: false });

        if (err) throw err;

        if (!allSuggestions || allSuggestions.length === 0) {
          setSuggestions([]);
          setLoading(false);
          return;
        }

        // Transform to include description from kitchen_items
        const transformed = (allSuggestions as SuggestionWithJoin[]).map((s) => ({
          ...s,
          description: s.kitchen_items?.name || "Unknown item",
        }));

        // Rank suggestions
        const ranked: RankedSuggestion[] = transformed.map((suggestion) => {
          const now = new Date();
          const lastUsedDate = suggestion.last_used
            ? new Date(suggestion.last_used)
            : null;
          const recencyDays = lastUsedDate
            ? Math.floor(
                (now.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
              )
            : 999;

          // Calculate score
          const useCount = suggestion.use_count || 0;
          const recencyPenalty = recencyDays * -0.1;

          const score = useCount * 0.5 + recencyPenalty;

          return {
            ...suggestion,
            score,
          };
        });

        // Filter by search query (if provided)
        let filtered = ranked;
        if (searchQuery.trim()) {
          const queryLower = searchQuery.toLowerCase();
          filtered = ranked.filter((s) =>
            (s.description || "").toLowerCase().includes(queryLower)
          );
        }

        // Sort by score (highest first)
        filtered.sort((a, b) => b.score - a.score);

        // Limit to top 10 results
        setSuggestions(filtered.slice(0, 10));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load suggestions";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadSuggestions();
  }, [stationId, shiftId, searchQuery]);

  return { suggestions, loading, error };
}

/**
 * Hook to get the last used quantity for a suggestion
 */
export function getLastQuantity(
  suggestion: KitchenItemSuggestion
): number | null {
  return suggestion.last_quantity || null;
}
