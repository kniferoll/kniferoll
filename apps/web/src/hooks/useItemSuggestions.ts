import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import type { Database } from "@kniferoll/types";

type KitchenItemSuggestion =
  Database["public"]["Tables"]["kitchen_item_suggestions"]["Row"];

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
  kitchenId: string | undefined,
  stationId: string | undefined,
  shiftName: string | undefined,
  searchQuery: string = ""
) {
  const [suggestions, setSuggestions] = useState<RankedSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!kitchenId || !stationId || !shiftName) {
      setSuggestions([]);
      return;
    }

    const loadSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all suggestions for this kitchen
        const { data: allSuggestions, error: err } = await supabase
          .from("kitchen_item_suggestions")
          .select("*")
          .eq("kitchen_id", kitchenId);

        if (err) throw err;

        if (!allSuggestions || allSuggestions.length === 0) {
          setSuggestions([]);
          setLoading(false);
          return;
        }

        // Fetch prep items to determine usage context
        const { data: prepItems, error: prepErr } = await supabase
          .from("prep_items")
          .select("description, station_id, shift_name")
          .eq("station_id", stationId);

        if (prepErr) {
          // Continue without context data if fetch fails
          console.error("Could not load prep context:", prepErr);
        }

        // Get all prep items for this station to check matches
        const { data: stationPrepItems } = await supabase
          .from("prep_items")
          .select("description, shift_name")
          .eq("station_id", stationId);

        // Build usage maps
        const stationShiftUsage = new Set(
          (prepItems || [])
            .filter((p) => p.shift_name === shiftName)
            .map((p) => p.description?.toLowerCase())
        );

        const stationUsage = new Set(
          (stationPrepItems || []).map((p) => p.description?.toLowerCase())
        );

        // Rank suggestions
        const ranked: RankedSuggestion[] = allSuggestions.map((suggestion) => {
          const descLower = suggestion.description.toLowerCase();
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
          const stationShiftMatch = stationShiftUsage.has(descLower) ? 1 : 0;
          const stationMatch = stationUsage.has(descLower) ? 1 : 0;
          const useCount = suggestion.use_count || 0;
          const recencyPenalty = recencyDays * -0.1;

          const score =
            stationShiftMatch * 10 +
            stationMatch * 5 +
            useCount * 0.5 +
            recencyPenalty;

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
            s.description.toLowerCase().includes(queryLower)
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
  }, [kitchenId, stationId, shiftName, searchQuery]);

  return { suggestions, loading, error };
}

/**
 * Hook to get the last used quantity for a suggestion
 */
export function getLastQuantity(
  suggestion: KitchenItemSuggestion
): number | null {
  return suggestion.last_quantity_used;
}
