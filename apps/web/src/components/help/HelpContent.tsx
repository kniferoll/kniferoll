import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { useLocation, useNavigate } from "react-router-dom";
import { useDarkModeContext } from "@/context";

interface HelpContentProps {
  content: string;
}

/**
 * Renders markdown content with:
 * - GitHub Flavored Markdown (tables, task lists, etc.)
 * - Auto-generated heading IDs for deep linking
 * - Scroll to hash on mount and navigation
 * - Internal link handling for help topics
 */
export function HelpContent({ content }: HelpContentProps) {
  const { isDark } = useDarkModeContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to hash on mount and when hash changes
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1);
      const element = document.getElementById(id);
      if (element) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.hash, content]);

  return (
    <div
      className={`prose max-w-none ${
        isDark
          ? "prose-invert prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300 prose-strong:text-white prose-a:text-orange-400 hover:prose-a:text-orange-300"
          : "prose-headings:text-gray-900 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-orange-600 hover:prose-a:text-orange-500"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          // Handle internal links to other help topics
          a: ({ href, children, ...props }) => {
            // Check if it's an internal help link
            if (href?.startsWith("/help")) {
              return (
                <a
                  {...props}
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(href);
                  }}
                  className="cursor-pointer"
                >
                  {children}
                </a>
              );
            }
            // External links open in new tab
            return (
              <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
