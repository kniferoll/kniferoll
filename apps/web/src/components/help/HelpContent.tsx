import { useEffect, useState, useCallback, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { useLocation, useNavigate } from "react-router-dom";
import { useDarkModeContext } from "@/context";

interface HelpContentProps {
  content: string;
}

interface HeadingProps {
  id?: string;
  children?: ReactNode;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Heading component with link icon for copy-to-clipboard functionality.
 */
function LinkableHeading({ id, children, level }: HeadingProps) {
  const { isDark } = useDarkModeContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!id) return;

    const url = `${window.location.origin}${window.location.pathname}${window.location.search}#${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Update URL without scrolling
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${id}`
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [id]);

  const baseStyles = "group relative cursor-default";
  const levelStyles = {
    1: "text-3xl font-bold mb-4 mt-8 first:mt-0",
    2: "text-2xl font-semibold mb-3 mt-8",
    3: "text-xl font-semibold mb-2 mt-6",
    4: "text-lg font-semibold mb-2 mt-4",
    5: "text-base font-semibold mb-2 mt-4",
    6: "text-sm font-semibold mb-2 mt-4",
  };

  const className = `${baseStyles} ${levelStyles[level]}`;

  const linkButton = id && (
    <button
      onClick={handleCopyLink}
      className={`inline-flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
        isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
      }`}
      aria-label="Copy link to this section"
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? (
        <svg
          className="w-4 h-4 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )}
    </button>
  );

  // Render the appropriate heading element based on level
  switch (level) {
    case 1:
      return (
        <h1 id={id} className={className}>
          {children}
          {linkButton}
        </h1>
      );
    case 2:
      return (
        <h2 id={id} className={className}>
          {children}
          {linkButton}
        </h2>
      );
    case 3:
      return (
        <h3 id={id} className={className}>
          {children}
          {linkButton}
        </h3>
      );
    case 4:
      return (
        <h4 id={id} className={className}>
          {children}
          {linkButton}
        </h4>
      );
    case 5:
      return (
        <h5 id={id} className={className}>
          {children}
          {linkButton}
        </h5>
      );
    case 6:
      return (
        <h6 id={id} className={className}>
          {children}
          {linkButton}
        </h6>
      );
  }
}

/**
 * Renders markdown content with:
 * - GitHub Flavored Markdown (tables, task lists, etc.)
 * - Auto-generated heading IDs for deep linking
 * - Linkable headings with copy-to-clipboard
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
      className={`markdown-content cursor-default ${isDark ? "text-gray-300" : "text-gray-700"}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          // Custom heading components with link icons
          h1: ({ id, children }) => (
            <LinkableHeading id={id} level={1}>
              {children}
            </LinkableHeading>
          ),
          h2: ({ id, children }) => (
            <LinkableHeading id={id} level={2}>
              {children}
            </LinkableHeading>
          ),
          h3: ({ id, children }) => (
            <LinkableHeading id={id} level={3}>
              {children}
            </LinkableHeading>
          ),
          h4: ({ id, children }) => (
            <LinkableHeading id={id} level={4}>
              {children}
            </LinkableHeading>
          ),
          h5: ({ id, children }) => (
            <LinkableHeading id={id} level={5}>
              {children}
            </LinkableHeading>
          ),
          h6: ({ id, children }) => (
            <LinkableHeading id={id} level={6}>
              {children}
            </LinkableHeading>
          ),
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
                  className="text-orange-500 hover:text-orange-400 underline cursor-pointer"
                >
                  {children}
                </a>
              );
            }
            // External links open in new tab
            return (
              <a
                {...props}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400 underline cursor-pointer"
              >
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
