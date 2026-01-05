import gettingStartedMd from "./getting-started.md?raw";
import stationsMd from "./stations.md?raw";
import prepItemsMd from "./prep-items.md?raw";
import invitingTeamMd from "./inviting-team.md?raw";
import rolesMd from "./roles.md?raw";
import faqMd from "./faq.md?raw";

export interface HelpGuide {
  slug: string;
  title: string;
  description: string;
  content: string;
  order: number;
  /** Optional category for grouping in sidebar */
  category?: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  order: number;
}

/**
 * Categories for grouping guides in the sidebar.
 * Guides without a category appear at the top level.
 */
export const helpCategories: HelpCategory[] = [
  { id: "basics", title: "Basics", order: 1 },
  { id: "team", title: "Team Management", order: 2 },
];

/**
 * Help guide registry.
 * Add new guides by importing the markdown file and adding an entry here.
 * Use the category field to group guides under a category in the sidebar.
 */
export const helpGuides: HelpGuide[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    description: "Learn the basics of Kniferoll",
    content: gettingStartedMd,
    order: 0,
  },
  {
    slug: "stations",
    title: "Stations",
    description: "Creating and managing work areas",
    content: stationsMd,
    order: 1,
    category: "basics",
  },
  {
    slug: "prep-items",
    title: "Prep Items",
    description: "Adding and completing prep tasks",
    content: prepItemsMd,
    order: 2,
    category: "basics",
  },
  {
    slug: "inviting-team",
    title: "Inviting Team",
    description: "Collaborate with your kitchen crew",
    content: invitingTeamMd,
    order: 1,
    category: "team",
  },
  {
    slug: "roles",
    title: "Roles & Permissions",
    description: "Understanding permissions",
    content: rolesMd,
    order: 2,
    category: "team",
  },
  {
    slug: "faq",
    title: "FAQ",
    description: "Common questions answered",
    content: faqMd,
    order: 100,
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

/**
 * Get guides organized by category for nested sidebar display.
 * Returns: { uncategorized: HelpGuide[], categories: { category: HelpCategory, guides: HelpGuide[] }[] }
 */
export function getGuidesGroupedByCategory() {
  const uncategorized = helpGuides.filter((g) => !g.category).sort((a, b) => a.order - b.order);

  const categories = helpCategories
    .sort((a, b) => a.order - b.order)
    .map((category) => ({
      category,
      guides: helpGuides
        .filter((g) => g.category === category.id)
        .sort((a, b) => a.order - b.order),
    }))
    .filter((c) => c.guides.length > 0);

  return { uncategorized, categories };
}
