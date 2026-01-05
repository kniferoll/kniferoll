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
  {
    slug: "stations",
    title: "Stations",
    description: "Creating and managing work areas",
    content: stationsMd,
    order: 2,
  },
  {
    slug: "prep-items",
    title: "Prep Items",
    description: "Adding and completing prep tasks",
    content: prepItemsMd,
    order: 3,
  },
  {
    slug: "inviting-team",
    title: "Inviting Team",
    description: "Collaborate with your kitchen crew",
    content: invitingTeamMd,
    order: 4,
  },
  {
    slug: "roles",
    title: "Roles",
    description: "Understanding permissions",
    content: rolesMd,
    order: 5,
  },
  {
    slug: "faq",
    title: "FAQ",
    description: "Common questions answered",
    content: faqMd,
    order: 6,
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
