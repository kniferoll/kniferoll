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

  const baseButtonClass = `w-full text-left px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer`;

  const getButtonClass = (isActive: boolean) => {
    if (isActive) {
      return `${baseButtonClass} ${
        isDark
          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          : "bg-orange-50 text-orange-600 border border-orange-100"
      }`;
    }
    return `${baseButtonClass} ${
      isDark
        ? "text-gray-400 hover:bg-slate-800 hover:text-white"
        : "text-gray-600 hover:bg-stone-100 hover:text-gray-900"
    }`;
  };

  return (
    <nav
      data-testid="help-sidebar"
      className={`w-64 flex-shrink-0 p-4 rounded-xl ${isDark ? "bg-slate-900" : "bg-white"}`}
    >
      <div className="space-y-6">
        <div>
          <h3
            className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Guides
          </h3>
          <div className="space-y-1">
            {guides.map((guide) => (
              <button
                key={guide.slug}
                onClick={() => onTopicChange(guide.slug)}
                className={getButtonClass(activeTopic === guide.slug)}
                aria-selected={activeTopic === guide.slug}
                role="button"
              >
                <span className="block">{guide.title}</span>
                <span
                  className={`block text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  {guide.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
