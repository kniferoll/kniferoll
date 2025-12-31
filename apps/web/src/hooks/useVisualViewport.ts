import { useState, useEffect } from "react";

/**
 * Hook to track visual viewport changes on iOS.
 * When the keyboard opens, the visual viewport shrinks but the layout viewport stays the same.
 * This hook returns the offset needed to keep fixed elements visible above the keyboard.
 */
export function useVisualViewport() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      // The difference between layout viewport and visual viewport
      // gives us the keyboard height
      const layoutHeight = window.innerHeight;
      const visualHeight = viewport.height;
      const offset = layoutHeight - visualHeight;

      // Only set offset if keyboard is likely open (offset > 100px)
      // This avoids small adjustments from URL bar changes
      setKeyboardOffset(offset > 100 ? offset : 0);
    };

    const handleScroll = () => {
      // On iOS, when keyboard opens, the page may scroll
      // We need to account for this in our positioning
      handleResize();
    };

    viewport.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleScroll);

    // Initial check
    handleResize();

    return () => {
      viewport.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { keyboardOffset };
}
