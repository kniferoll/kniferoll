import { useDarkModeContext } from "@/context";
import { ChevronUpIcon } from "@/components/icons";

interface ControlsToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

/**
 * ControlsToggle - centered pill/handle button for collapsing station controls.
 *
 * Shows a chevron that rotates based on collapsed state.
 * Designed to be subtle but accessible.
 */
export function ControlsToggle({ isCollapsed, onToggle }: ControlsToggleProps) {
  const { isDark } = useDarkModeContext();

  return (
    <button
      onClick={onToggle}
      className={`
        mx-auto flex items-center justify-center
        w-12 h-6 rounded-full
        transition-all cursor-pointer
        ${
          isDark
            ? "bg-slate-800 border border-slate-700 hover:bg-slate-700"
            : "bg-white border border-gray-200 shadow-sm hover:shadow-md hover:bg-gray-50"
        }
      `}
      aria-label={isCollapsed ? "Show controls" : "Hide controls"}
      aria-expanded={!isCollapsed}
    >
      <ChevronUpIcon
        size={16}
        className={`
          transition-transform duration-300
          ${isDark ? "text-slate-400" : "text-gray-500"}
          ${isCollapsed ? "rotate-180" : ""}
        `}
      />
    </button>
  );
}
