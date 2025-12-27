/**
 * Skeleton loaders for improved perceived performance
 * Uses Tailwind's animate-pulse for smooth loading states
 */

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
      <div className="flex animate-pulse space-x-4">
        <div className="h-10 w-10 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-3 py-1">
          <div className="h-3 rounded bg-gray-200 dark:bg-slate-700 w-3/4" />
          <div className="h-3 rounded bg-gray-200 dark:bg-slate-700 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStationCard() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-1/3 rounded bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700" />
          <div className="h-3 w-4/5 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="pt-2">
          <div className="h-8 w-24 rounded bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProgress() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 w-1/2" />
      <div className="h-6 rounded bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}

export function SkeletonFormInput() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
      <div className="h-10 rounded bg-gray-200 dark:bg-slate-700" />
    </div>
  );
}
