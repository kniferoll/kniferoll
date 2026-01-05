import { useEffect, useState } from "react";
import { useDarkModeContext } from "@/context";
import { getGuidesGroupedByCategory, type HelpGuide, type HelpCategory } from "@/content/help";

interface HelpMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  guides: HelpGuide[];
  activeTopic: string;
  onTopicChange: (slug: string) => void;
}

/**
 * Mobile slide-out menu for help navigation.
 * Slides in from the left with backdrop overlay.
 * Shows nested categories with expand/collapse.
 */
export function HelpMobileMenu({
  isOpen,
  onClose,
  activeTopic,
  onTopicChange,
}: HelpMobileMenuProps) {
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

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const renderGuideButton = (guide: HelpGuide, indent = false) => {
    const isActive = activeTopic === guide.slug;
    return (
      <button
        key={guide.slug}
        onClick={() => onTopicChange(guide.slug)}
        className={`w-full text-left py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
          indent ? "pl-8 pr-3" : "px-3"
        } ${
          isActive
            ? isDark
              ? "bg-orange-500/10 text-orange-400"
              : "bg-orange-50 text-orange-600"
            : isDark
              ? "text-gray-300 hover:bg-slate-800"
              : "text-gray-700 hover:bg-gray-100"
        }`}
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
      <div key={category.id} className="mt-1">
        <button
          onClick={() => toggleCategory(category.id)}
          className={`w-full flex items-center gap-2 py-2.5 px-3 text-sm cursor-pointer rounded-lg transition-colors ${
            hasActiveChild && !isExpanded
              ? isDark
                ? "text-orange-400"
                : "text-orange-600"
              : isDark
                ? "text-gray-200 hover:bg-slate-800"
                : "text-gray-800 hover:bg-gray-100"
          }`}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
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
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isDark ? "border-slate-700" : "border-gray-200"
          }`}
        >
          <h2 className={`font-semibold cursor-default ${isDark ? "text-white" : "text-gray-900"}`}>
            Documentation
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg cursor-pointer ${
              isDark ? "hover:bg-slate-800 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <nav className="p-4 overflow-y-auto h-[calc(100%-65px)]">
          {/* Uncategorized guides at top */}
          <div className="space-y-0.5">{uncategorized.map((g) => renderGuideButton(g))}</div>

          {/* Categorized guides */}
          {categories.map(renderCategory)}
        </nav>
      </div>
    </>
  );
}
