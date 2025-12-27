import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkModeProvider } from "./context/DarkModeContext";
import "./index.css";
import App from "./App.tsx";

// Lazy load monitoring tools
const SpeedInsights = lazy(() =>
  import("@vercel/speed-insights/react").then((m) => ({
    default: m.SpeedInsights,
  }))
);
const Analytics = lazy(() =>
  import("@vercel/analytics/react").then((m) => ({ default: m.Analytics }))
);

// Create QueryClient outside render to avoid recreating it
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      // Add stale while revalidate for better UX
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

const isDev = process.env.NODE_ENV === "development";
const root = createRoot(document.getElementById("root")!);

root.render(
  isDev ? (
    <StrictMode>
      <DarkModeProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Suspense fallback={null}>
            <SpeedInsights />
            <Analytics />
          </Suspense>
        </QueryClientProvider>
      </DarkModeProvider>
    </StrictMode>
  ) : (
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Suspense fallback={null}>
          <SpeedInsights />
          <Analytics />
        </Suspense>
      </QueryClientProvider>
    </DarkModeProvider>
  )
);
