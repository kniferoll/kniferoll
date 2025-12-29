import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { Card, IconBox } from "@/components";

interface AddCardProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  disabledLabel?: string;
}

/**
 * AddCard - dashed card for "add new" actions.
 */
export function AddCard({
  label,
  onClick,
  disabled = false,
  disabledLabel,
}: AddCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <Card
      variant="dashed"
      padding="none"
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center min-h-60 w-full cursor-pointer
        ${
          !disabled
            ? isDark
              ? "hover:border-orange-500 hover:bg-orange-500/5"
              : "hover:border-orange-400 hover:bg-orange-100/20"
            : isDark
            ? "opacity-60 hover:opacity-80 hover:border-slate-600"
            : "opacity-60 hover:opacity-80 hover:border-stone-400"
        }
      `}
    >
      {/* Lock icon for disabled state */}
      {disabled && (
        <div
          className={`absolute top-6 right-6 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
      )}

      <IconBox
        size="xl"
        variant={disabled ? "muted" : "default"}
        className="mb-6"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </IconBox>

      <span
        className={`text-lg font-semibold mb-2 tracking-tight cursor-pointer ${
          disabled
            ? isDark
              ? "text-gray-500"
              : "text-gray-600"
            : isDark
            ? "text-white"
            : "text-gray-900"
        }`}
      >
        {label}
      </span>

      {disabled && disabledLabel && (
        <span className="text-sm font-semibold text-orange-500 cursor-pointer">
          {disabledLabel}
        </span>
      )}
    </Card>
  );
}
