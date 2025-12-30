import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState component for displaying empty or error states consistently.
 * Use when a list/grid has no items, or when something hasn't been set up yet.
 *
 * @example
 * // Simple empty state
 * <EmptyState
 *   title="No stations yet"
 *   description="Add your first station to get started"
 * />
 *
 * @example
 * // With icon and action
 * <EmptyState
 *   icon={<StationIcon className="w-12 h-12" />}
 *   title="No stations yet"
 *   description="Create stations to organize your prep lists"
 *   action={{ label: "Add Station", onClick: handleAdd }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && (
        <div className={`mb-4 ${isDark ? "text-slate-500" : "text-stone-400"}`}>
          {icon}
        </div>
      )}

      <h3
        className={`text-lg font-semibold mb-1 ${
          isDark ? "text-slate-200" : "text-stone-700"
        }`}
      >
        {title}
      </h3>

      {description && (
        <p
          className={`text-sm max-w-sm ${
            isDark ? "text-slate-400" : "text-stone-500"
          }`}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-6">
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
