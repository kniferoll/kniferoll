import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { DarkModeProvider } from "./context/DarkModeContext";
import "./index.css";
import App from "./App.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DarkModeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <SpeedInsights />
      </QueryClientProvider>
    </DarkModeProvider>
  </StrictMode>
);
