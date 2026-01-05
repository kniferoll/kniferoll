import { useSearchParams } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { HelpContent, HelpSidebar } from "@/components/help";
import { getAllGuides, getGuideBySlug } from "@/content/help";

/**
 * Help Center page
 *
 * Displays help guides and documentation with:
 * - Sidebar navigation on desktop
 * - Horizontal pill navigation on mobile
 * - Deep linking support via URL params and hash
 *
 * URL format: /help?topic=getting-started#section-heading
 */
export function HelpCenter() {
  const { isDark } = useDarkModeContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const guides = getAllGuides();
  const activeTopic = searchParams.get("topic") || guides[0]?.slug || "getting-started";
  const activeGuide = getGuideBySlug(activeTopic);

  const handleTopicChange = (slug: string) => {
    setSearchParams({ topic: slug });
    // Scroll to top when changing topics
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
      <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-2 cursor-default">
        Help Center
      </h1>
      <p className={`text-sm cursor-default ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Guides and documentation to help you get the most out of Kniferoll
      </p>

      {/* Mobile navigation pills */}
      <div className="mt-8 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {guides.map((guide) => (
            <button
              key={guide.slug}
              onClick={() => handleTopicChange(guide.slug)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeTopic === guide.slug
                  ? isDark
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                    : "bg-orange-50 text-orange-600 border border-orange-100"
                  : isDark
                    ? "bg-slate-800 text-gray-400"
                    : "bg-stone-100 text-gray-600"
              }`}
            >
              {guide.title}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop layout with sidebar */}
      <div className="mt-12 flex gap-16">
        {/* Sidebar - hidden on mobile/tablet */}
        <div className="hidden lg:block">
          <HelpSidebar
            guides={guides}
            activeTopic={activeTopic}
            onTopicChange={handleTopicChange}
          />
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 max-w-3xl">
          {activeGuide ? (
            <HelpContent content={activeGuide.content} />
          ) : (
            <div className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
              <p>Guide not found. Please select a topic from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
