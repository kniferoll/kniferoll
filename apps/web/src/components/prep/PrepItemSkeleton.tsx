import { useDarkModeContext } from "@/context";
import { useMemo } from "react";

interface PrepItemSkeletonProps {
  count?: number;
  isCompact?: boolean;
}

// Pre-computed widths for skeleton text to avoid Math.random() during render
const SKELETON_WIDTHS = ["72%", "85%", "68%", "78%", "65%", "82%", "75%", "70%"];

/**
 * Skeleton loader for prep items that matches the exact layout of PrepItemList.
 * Shows pulsing placeholders while data is loading.
 */
export function PrepItemSkeleton({ count = 5, isCompact = false }: PrepItemSkeletonProps) {
  const { isDark } = useDarkModeContext();

  const itemPadding = isCompact ? "px-3 py-2" : "px-4 py-3";
  const itemGap = isCompact ? "gap-2" : "gap-3";
  const statusButtonSize = isCompact ? "w-9 h-9" : "w-12 h-12";
  const textHeight = isCompact ? "h-4" : "h-5";
  const pillHeight = isCompact ? "h-5" : "h-6";

  const bgColor = isDark ? "bg-slate-700" : "bg-stone-200";
  const borderColor = isDark ? "border-slate-700" : "border-stone-200";
  const cardBg = isDark ? "bg-slate-900" : "bg-white";

  // Memoize the items array to ensure stable rendering
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        key: i,
        width: SKELETON_WIDTHS[i % SKELETON_WIDTHS.length],
        delay: i * 100,
      })),
    [count]
  );

  return (
    <div className={isCompact ? "space-y-1.5" : "space-y-2"}>
      {items.map((item) => (
        <div
          key={item.key}
          className={`
            flex items-center ${itemGap} ${itemPadding} rounded-xl
            border ${borderColor} ${cardBg}
            shadow-sm animate-pulse
          `}
          style={{
            animationDelay: `${item.delay}ms`,
          }}
        >
          {/* Status Icon Skeleton */}
          <div className={`shrink-0 ${statusButtonSize} rounded-full ${bgColor}`} />

          {/* Description Skeleton */}
          <div className="flex-1 min-w-0">
            <div className={`${textHeight} ${bgColor} rounded-md`} style={{ width: item.width }} />
          </div>

          {/* Badge Skeleton - hidden on mobile */}
          <div className={`hidden sm:block ${pillHeight} w-16 ${bgColor} rounded-full shrink-0`} />

          {/* Delete Button Skeleton */}
          <div className={`shrink-0 w-8 h-8 ${bgColor} rounded-lg`} />
        </div>
      ))}
    </div>
  );
}
