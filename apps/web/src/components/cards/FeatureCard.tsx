import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

/**
 * FeatureCard - icon + title + description for feature lists.
 * Horizontal layout with icon on the left.
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="flex gap-4">
      {/* Icon container */}
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isDark
            ? "bg-slate-800 text-orange-400 border border-slate-700"
            : "bg-orange-50 text-orange-500 border border-orange-100"
        }`}
      >
        {icon}
      </div>

      {/* Content */}
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p
          className={`text-sm leading-relaxed ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}
