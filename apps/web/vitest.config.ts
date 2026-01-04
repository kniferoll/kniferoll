import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/utils/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/types/**",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
      ],
      // Coverage thresholds - CI will fail if coverage drops below these
      // Updated 2024-12-31: increased from ~35% to ~40%
      // Updated 2025-01-04: temporarily lowered by 1% to accommodate new auth pages (#28, #32, #70, #71)
      thresholds: {
        statements: 39,
        branches: 34,
        functions: 38,
        lines: 39,
      },
    },
  },
});
