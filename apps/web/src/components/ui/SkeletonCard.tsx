import { useDarkModeContext } from "@/context";

interface SkeletonCardProps {
  /** Height of the skeleton. Default is "md" */
  height?: "sm" | "md" | "lg";
}

const heightClasses = {
  sm: "h-16",
  md: "h-24",
  lg: "h-32",
};

/**
 * SkeletonCard component for loading states.
 * Displays a pulsing placeholder card while content is loading.
 *
 * @example
 * // In a grid
 * {loading ? (
 *   Array.from({ length: 3 }).map((_, i) => (
 *     <SkeletonCard key={i} />
 *   ))
 * ) : (
 *   items.map(item => <ItemCard key={item.id} {...item} />)
 * )}
 */
export function SkeletonCard({ height = "md" }: SkeletonCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="animate-pulse">
      <div
        className={`${heightClasses[height]} rounded-2xl ${
          isDark ? "bg-slate-700" : "bg-stone-200"
        }`}
      />
    </div>
  );
}
