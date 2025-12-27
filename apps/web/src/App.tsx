import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useAuthStore } from "./stores/authStore";
import { useOfflineStore } from "./stores/offlineStore";

// Lazy load pages to reduce initial bundle size
const Landing = lazy(() =>
  import("./pages/Landing").then((m) => ({ default: m.Landing }))
);
const Login = lazy(() =>
  import("./pages/Login").then((m) => ({ default: m.Login }))
);
const Signup = lazy(() =>
  import("./pages/Signup").then((m) => ({ default: m.Signup }))
);
const JoinKitchen = lazy(() =>
  import("./pages/JoinKitchen").then((m) => ({ default: m.JoinKitchen }))
);
const KitchenOnboarding = lazy(() =>
  import("./pages/KitchenOnboarding").then((m) => ({
    default: m.KitchenOnboarding,
  }))
);
const ChefDashboard = lazy(() =>
  import("./pages/ChefDashboard").then((m) => ({ default: m.ChefDashboard }))
);
const StationView = lazy(() =>
  import("./pages/StationView").then((m) => ({ default: m.StationView }))
);
const StationSelection = lazy(() =>
  import("./pages/StationSelection").then((m) => ({
    default: m.StationSelection,
  }))
);

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950" />
  );
}

function App() {
  const { initialize } = useAuthStore();
  const { initialize: initializeOffline } = useOfflineStore();

  useEffect(() => {
    // Use requestIdleCallback if available, otherwise defer with setTimeout
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        initialize();
        initializeOffline();
      });
    } else {
      const timeoutId = setTimeout(() => {
        initialize();
        initializeOffline();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [initialize, initializeOffline]);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join" element={<JoinKitchen />} />
          <Route path="/join/:code" element={<JoinKitchen />} />
          <Route path="/join/:code/stations" element={<StationSelection />} />
          <Route path="/kitchen/new" element={<KitchenOnboarding />} />
          <Route path="/dashboard" element={<ChefDashboard />} />
          <Route path="/station/:id" element={<StationView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
