import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { getGuidesGroupedByCategory, type HelpGuide, type HelpCategory } from "@/content/help";

interface HelpSidebarProps {
  guides: HelpGuide[];
  activeTopic: string;
  onTopicChange: (slug: string) => void;
}

/**
 * Sidebar navigation for help guides with nested categories.
 * Shows uncategorized guides at top level, then collapsible categories.
 */
export function HelpSidebar({ activeTopic, onTopicChange }: HelpSidebarProps) {
  const { isDark } = useDarkModeContext();
  const { uncategorized, categories } = getGuidesGroupedByCategory();

  // Track expanded categories - all expanded by default
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.category.id))
  );

  const toggleCategory = (categoryId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderGuideButton = (guide: HelpGuide, indent = false) => {
    const isActive = activeTopic === guide.slug;
    return (
      <button
        key={guide.slug}
        onClick={() => onTopicChange(guide.slug)}
        className={`w-full text-left py-1.5 rounded text-sm transition-colors cursor-pointer ${
          indent ? "pl-6 pr-2" : "px-2"
        } ${
          isActive
            ? isDark
              ? "text-orange-400 font-medium"
              : "text-orange-600 font-medium"
            : isDark
              ? "text-gray-400 hover:text-white"
              : "text-gray-600 hover:text-gray-900"
        }`}
        aria-selected={isActive}
      >
        {guide.title}
      </button>
    );
  };

  const renderCategory = ({
    category,
    guides,
  }: {
    category: HelpCategory;
    guides: HelpGuide[];
  }) => {
    const isExpanded = expanded.has(category.id);
    const hasActiveChild = guides.some((g) => g.slug === activeTopic);

    return (
      <div key={category.id} className="mt-2">
        <button
          onClick={() => toggleCategory(category.id)}
          className={`w-full flex items-center gap-1 py-1.5 px-2 text-sm cursor-pointer rounded transition-colors ${
            hasActiveChild && !isExpanded
              ? isDark
                ? "text-orange-400"
                : "text-orange-600"
              : isDark
                ? "text-gray-300 hover:text-white"
                : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium">{category.title}</span>
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-0.5">{guides.map((g) => renderGuideButton(g, true))}</div>
        )}
      </div>
    );
  };

  return (
    <nav data-testid="help-sidebar" className="w-52 flex-shrink-0">
      <div className="sticky top-8">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider mb-3 px-2 cursor-default ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          Documentation
        </h3>

        {/* Uncategorized guides at top */}
        <div className="space-y-0.5">{uncategorized.map((g) => renderGuideButton(g))}</div>

        {/* Categorized guides */}
        {categories.map(renderCategory)}
      </div>
    </nav>
  );
}
