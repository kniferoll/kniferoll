import { useDarkModeContext } from "../context/DarkModeContext";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  size?: "sm" | "md" | "lg";
}

/**
 * SectionHeader - consistent section headings.
 *
 * Sizes:
 * - sm: text-xl (subsections)
 * - md: text-2xl md:text-3xl (main sections)
 * - lg: text-3xl md:text-4xl (page titles)
 */
export function SectionHeader({
  title,
  subtitle,
  align = "center",
  size = "md",
}: SectionHeaderProps) {
  const { isDark } = useDarkModeContext();

  const alignStyles = {
    left: "text-left",
    center: "text-center",
  };

  const titleSizeStyles = {
    sm: "text-xl font-semibold",
    md: "text-2xl md:text-3xl font-semibold tracking-tight",
    lg: "text-3xl md:text-4xl font-semibold tracking-tight",
  };

  return (
    <div className={alignStyles[align]}>
      <h2 className={titleSizeStyles[size]}>{title}</h2>
      {subtitle && (
        <p
          className={`mt-2 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
