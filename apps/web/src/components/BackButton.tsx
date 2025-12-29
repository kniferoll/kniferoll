import { useDarkModeContext } from "../context/DarkModeContext";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

/**
 * Back navigation button for use in headers.
 */
export function BackButton({ onClick, label = "Back" }: BackButtonProps) {
  const { isDark } = useDarkModeContext();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isDark
          ? "text-gray-300 hover:text-white hover:bg-slate-700"
          : "text-gray-600 hover:text-gray-900 hover:bg-stone-200/50"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      <span className="sr-only sm:not-sr-only">{label}</span>
    </button>
  );
}
