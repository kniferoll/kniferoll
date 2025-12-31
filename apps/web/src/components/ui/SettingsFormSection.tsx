import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface SettingsFormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Reusable settings form section following Tailwind UI pattern
 * Grid-based layout with title/description on left, form on right
 */
export function SettingsFormSection({
  title,
  description,
  children,
}: SettingsFormSectionProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 sm:py-8 md:grid-cols-3">
      <div>
        <h2
          className={classNames(
            "text-base font-semibold",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          {title}
        </h2>
        {description && (
          <p
            className={classNames(
              "mt-1 text-sm leading-6",
              isDark ? "text-slate-400" : "text-gray-600"
            )}
          >
            {description}
          </p>
        )}
      </div>

      <div className="md:col-span-2">{children}</div>
    </div>
  );
}
