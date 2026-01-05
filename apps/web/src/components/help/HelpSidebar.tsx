import { useDarkModeContext } from "@/context";
import type { HelpGuide } from "@/content/help";

interface HelpSidebarProps {
  guides: HelpGuide[];
  activeTopic: string;
  onTopicChange: (slug: string) => void;
}

/**
 * Sidebar navigation for help guides.
 * Displays all available guides with active state highlighting.
 */
export function HelpSidebar({ guides, activeTopic, onTopicChange }: HelpSidebarProps) {
  const { isDark } = useDarkModeContext();

  return (
    <nav data-testid="help-sidebar" className="w-56 flex-shrink-0">
      <div className="sticky top-24">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-3 ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Guides
        </h3>
        <div className="space-y-1">
          {guides.map((guide) => {
            const isActive = activeTopic === guide.slug;
            return (
              <button
                key={guide.slug}
                onClick={() => onTopicChange(guide.slug)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  isActive
                    ? isDark
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-orange-50 text-orange-600"
                    : isDark
                      ? "text-gray-400 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                }`}
                aria-selected={isActive}
              >
                {guide.title}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
