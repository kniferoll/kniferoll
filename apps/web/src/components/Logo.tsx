import { useDarkModeContext } from "../context/DarkModeContext";

interface LogoProps {
  onClick?: () => void;
}

export function Logo({ onClick }: LogoProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className={`flex items-center gap-3 cursor-pointer`} onClick={onClick}>
      <div className="w-9 h-9 bg-linear-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
        </svg>
      </div>
      <span
        className={`text-xl font-semibold tracking-tight ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        Kniferoll
      </span>
    </div>
  );
}
