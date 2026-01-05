import { useDarkModeContext } from "@/context";

/**
 * Help Center page
 *
 * Displays help guides and documentation.
 * Uses the default header from PublicLayout.
 */
export function HelpCenter() {
  const { isDark } = useDarkModeContext();

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 cursor-default">
        Help Center
      </h1>
      <p className={`text-sm cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Guides and documentation to help you get the most out of Kniferoll
      </p>

      <div
        className={`mt-12 space-y-8 cursor-default ${isDark ? "text-gray-300" : "text-gray-700"}`}
      >
        <p>Help content coming soon.</p>
      </div>
    </div>
  );
}
