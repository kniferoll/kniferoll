import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { HelpContent, HelpSidebar, HelpMobileMenu } from "@/components/help";
import { getAllGuides, getGuideBySlug } from "@/content/help";

/**
 * Help Center page
 *
 * Displays help guides and documentation with:
 * - Fixed sidebar navigation on desktop
 * - Hamburger slide-out menu on mobile
 * - Scrollable content area
 * - Deep linking support via URL params and hash
 *
 * URL format: /help?topic=getting-started#section-heading
 */
export function HelpCenter() {
  const { isDark } = useDarkModeContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const guides = getAllGuides();
  const activeTopic = searchParams.get("topic") || guides[0]?.slug || "getting-started";
  const activeGuide = getGuideBySlug(activeTopic);

  const handleTopicChange = (slug: string) => {
    setSearchParams({ topic: slug });
    setMobileMenuOpen(false);
    // Scroll content to top when changing topics
    const contentArea = document.getElementById("help-content-area");
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)]">
      {/* Header area - fixed */}
      <div className="flex-shrink-0 px-6 lg:px-12 pt-8 pb-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`lg:hidden p-2 -ml-2 rounded-lg cursor-pointer ${
              isDark ? "hover:bg-slate-800" : "hover:bg-stone-200"
            }`}
            aria-label="Open navigation menu"
          >
            <svg
              className={`w-6 h-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight cursor-default">
              Help Center
            </h1>
            <p
              className={`text-sm cursor-default mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Guides and documentation for Kniferoll
            </p>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0 max-w-7xl mx-auto w-full px-6 lg:px-12">
        {/* Desktop sidebar - fixed */}
        <div className="hidden lg:block flex-shrink-0 pr-12">
          <HelpSidebar
            guides={guides}
            activeTopic={activeTopic}
            onTopicChange={handleTopicChange}
          />
        </div>

        {/* Content area - scrollable */}
        <div id="help-content-area" className="flex-1 min-w-0 overflow-y-auto pb-12">
          <div className="max-w-3xl">
            {activeGuide ? (
              <HelpContent content={activeGuide.content} />
            ) : (
              <div className={`cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                <p>Guide not found. Please select a topic from the sidebar.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile slide-out menu */}
      <HelpMobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        guides={guides}
        activeTopic={activeTopic}
        onTopicChange={handleTopicChange}
      />
    </div>
  );
}
