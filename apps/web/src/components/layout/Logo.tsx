import { useDarkModeContext } from "@/context/DarkModeContext";
import { KniferollIcon } from "@/components/icons/KniferollIcon";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  onClick?: () => void;
}

/**
 * Kniferoll logo - icon + optional wordmark
 *
 * Sizes:
 * - sm: w-7 h-7, text-sm (footer)
 * - md: w-9 h-9, text-xl (header)
 * - lg: w-12 h-12, text-2xl (hero/splash)
 */
export function Logo({ size = "md", showText = true, onClick }: LogoProps) {
  const { isDark } = useDarkModeContext();

  const sizeConfig = {
    sm: { box: "w-7 h-7 rounded-md", icon: 14, text: "text-sm" },
    md: { box: "w-9 h-9 rounded-lg", icon: 20, text: "text-xl" },
    lg: { box: "w-12 h-12 rounded-xl", icon: 28, text: "text-2xl" },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`flex items-center gap-3 ${
        onClick ? "cursor-pointer" : "cursor-default"
      }`}
      onClick={onClick}
    >
      <div
        className={`${config.box} bg-linear-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30`}
      >
        <KniferollIcon size={config.icon} className="text-white" />
      </div>
      {showText && (
        <span
          className={`${config.text} font-semibold tracking-tight ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Kniferoll
        </span>
      )}
    </div>
  );
}
