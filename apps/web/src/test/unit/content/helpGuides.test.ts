import { describe, it, expect } from "vitest";
import {
  helpGuides,
  helpCategories,
  getGuideBySlug,
  getAllGuides,
  getGuidesGroupedByCategory,
} from "@/content/help";

describe("Help Guide Registry", () => {
  describe("helpGuides", () => {
    it("contains expected guides", () => {
      const slugs = helpGuides.map((g) => g.slug);

      expect(slugs).toContain("getting-started");
      expect(slugs).toContain("stations");
      expect(slugs).toContain("prep-items");
      expect(slugs).toContain("inviting-team");
      expect(slugs).toContain("roles");
      expect(slugs).toContain("faq");
    });

    it("all guides have required fields", () => {
      helpGuides.forEach((guide) => {
        expect(guide.slug).toBeTruthy();
        expect(guide.title).toBeTruthy();
        expect(guide.description).toBeTruthy();
        expect(guide.content).toBeTruthy();
        expect(typeof guide.order).toBe("number");
      });
    });

    it("all guides have unique slugs", () => {
      const slugs = helpGuides.map((g) => g.slug);
      const uniqueSlugs = [...new Set(slugs)];

      expect(slugs.length).toBe(uniqueSlugs.length);
    });
  });

  describe("helpCategories", () => {
    it("contains expected categories", () => {
      const ids = helpCategories.map((c) => c.id);

      expect(ids).toContain("basics");
      expect(ids).toContain("team");
    });

    it("all categories have required fields", () => {
      helpCategories.forEach((category) => {
        expect(category.id).toBeTruthy();
        expect(category.title).toBeTruthy();
        expect(typeof category.order).toBe("number");
      });
    });
  });

  describe("getGuideBySlug", () => {
    it("returns guide for valid slug", () => {
      const guide = getGuideBySlug("getting-started");

      expect(guide).toBeDefined();
      expect(guide?.slug).toBe("getting-started");
      expect(guide?.title).toBe("Getting Started");
    });

    it("returns undefined for invalid slug", () => {
      const guide = getGuideBySlug("non-existent-guide");

      expect(guide).toBeUndefined();
    });

    it("returns guide for categorized guide slug", () => {
      const guide = getGuideBySlug("stations");

      expect(guide).toBeDefined();
      expect(guide?.slug).toBe("stations");
      expect(guide?.category).toBe("basics");
    });
  });

  describe("getAllGuides", () => {
    it("returns all guides", () => {
      const guides = getAllGuides();

      expect(guides.length).toBe(helpGuides.length);
    });

    it("returns guides sorted by order", () => {
      const guides = getAllGuides();

      for (let i = 1; i < guides.length; i++) {
        expect(guides[i].order).toBeGreaterThanOrEqual(guides[i - 1].order);
      }
    });

    it("does not mutate original array", () => {
      const originalLength = helpGuides.length;
      const guides = getAllGuides();

      guides.push({
        slug: "test",
        title: "Test",
        description: "Test",
        content: "Test",
        order: 999,
      });

      expect(helpGuides.length).toBe(originalLength);
    });
  });

  describe("getGuidesGroupedByCategory", () => {
    it("returns uncategorized guides", () => {
      const { uncategorized } = getGuidesGroupedByCategory();

      expect(uncategorized.length).toBeGreaterThan(0);

      // Getting Started and FAQ should be uncategorized
      const slugs = uncategorized.map((g) => g.slug);
      expect(slugs).toContain("getting-started");
      expect(slugs).toContain("faq");
    });

    it("returns categorized guides", () => {
      const { categories } = getGuidesGroupedByCategory();

      expect(categories.length).toBeGreaterThan(0);
    });

    it("groups basics guides correctly", () => {
      const { categories } = getGuidesGroupedByCategory();
      const basicsCategory = categories.find((c) => c.category.id === "basics");

      expect(basicsCategory).toBeDefined();
      expect(basicsCategory?.guides.length).toBeGreaterThan(0);

      const slugs = basicsCategory?.guides.map((g) => g.slug) || [];
      expect(slugs).toContain("stations");
      expect(slugs).toContain("prep-items");
    });

    it("groups team guides correctly", () => {
      const { categories } = getGuidesGroupedByCategory();
      const teamCategory = categories.find((c) => c.category.id === "team");

      expect(teamCategory).toBeDefined();
      expect(teamCategory?.guides.length).toBeGreaterThan(0);

      const slugs = teamCategory?.guides.map((g) => g.slug) || [];
      expect(slugs).toContain("inviting-team");
      expect(slugs).toContain("roles");
    });

    it("sorts uncategorized guides by order", () => {
      const { uncategorized } = getGuidesGroupedByCategory();

      for (let i = 1; i < uncategorized.length; i++) {
        expect(uncategorized[i].order).toBeGreaterThanOrEqual(uncategorized[i - 1].order);
      }
    });

    it("sorts categories by order", () => {
      const { categories } = getGuidesGroupedByCategory();

      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].category.order).toBeGreaterThanOrEqual(
          categories[i - 1].category.order
        );
      }
    });

    it("sorts guides within categories by order", () => {
      const { categories } = getGuidesGroupedByCategory();

      categories.forEach(({ guides }) => {
        for (let i = 1; i < guides.length; i++) {
          expect(guides[i].order).toBeGreaterThanOrEqual(guides[i - 1].order);
        }
      });
    });
  });
});
