import gettingStartedMd from "./getting-started.md?raw";

export interface HelpGuide {
  slug: string;
  title: string;
  description: string;
  content: string;
  order: number;
}

/**
 * Help guide registry.
 * Add new guides by importing the markdown file and adding an entry here.
 */
export const helpGuides: HelpGuide[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of Kniferoll",
    content: gettingStartedMd,
    order: 1,
  },
];

/**
 * Get a guide by its slug.
 */
export function getGuideBySlug(slug: string): HelpGuide | undefined {
  return helpGuides.find((g) => g.slug === slug);
}

/**
 * Get all guides sorted by order.
 */
export function getAllGuides(): HelpGuide[] {
  return [...helpGuides].sort((a, b) => a.order - b.order);
}
