import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TestProviders } from "@/test/utils/providers";
import { HelpContent } from "./HelpContent";

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve()),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe("HelpContent", () => {
  const sampleMarkdown = `# Main Title

This is a paragraph with some **bold** text.

## Section One

This is section one content.

### Subsection

Some subsection content.

- List item 1
- List item 2

[External Link](https://example.com)

[Internal Link](/help?topic=faq)
`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders markdown content", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText("Main Title")).toBeInTheDocument();
      expect(screen.getByText("Section One")).toBeInTheDocument();
      expect(screen.getByText("Subsection")).toBeInTheDocument();
    });

    it("renders paragraphs", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument();
    });

    it("renders bold text", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText("bold")).toBeInTheDocument();
    });

    it("renders list items", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText("List item 1")).toBeInTheDocument();
      expect(screen.getByText("List item 2")).toBeInTheDocument();
    });

    it("renders external links with target blank", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      const externalLink = screen.getByText("External Link");
      expect(externalLink).toHaveAttribute("target", "_blank");
      expect(externalLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders internal help links without target blank", () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      const internalLink = screen.getByText("Internal Link");
      expect(internalLink).not.toHaveAttribute("target", "_blank");
    });
  });

  describe("Linkable headers", () => {
    it("renders headings with IDs for deep linking", async () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      // rehype-slug generates IDs from heading text
      await waitFor(() => {
        const mainTitle = screen.getByRole("heading", { name: /main title/i });
        expect(mainTitle).toHaveAttribute("id");
      });
    });

    it("shows link button on heading hover", async () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      // Link buttons should be present (opacity-0 by default, shown on hover)
      const linkButtons = screen.getAllByRole("button", { name: /copy link/i });
      expect(linkButtons.length).toBeGreaterThan(0);
    });

    it("copies link to clipboard when link button is clicked", async () => {
      render(
        <TestProviders>
          <HelpContent content={sampleMarkdown} />
        </TestProviders>
      );

      const linkButtons = screen.getAllByRole("button", { name: /copy link/i });
      fireEvent.click(linkButtons[0]);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe("Tables", () => {
    const tableMarkdown = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

    it("renders tables from GFM", () => {
      render(
        <TestProviders>
          <HelpContent content={tableMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText("Column 1")).toBeInTheDocument();
      expect(screen.getByText("Cell 1")).toBeInTheDocument();
    });
  });

  describe("Code blocks", () => {
    const codeMarkdown = "Here is some `inline code` in a paragraph.";

    it("renders inline code", () => {
      render(
        <TestProviders>
          <HelpContent content={codeMarkdown} />
        </TestProviders>
      );

      expect(screen.getByText("inline code")).toBeInTheDocument();
    });
  });
});
