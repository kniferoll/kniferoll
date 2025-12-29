import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { useAuthStore } from "./stores/authStore";

// Lazy load pages
const Landing = lazy(() =>
  import("./pages/Landing").then((m) => ({ default: m.Landing }))
);
const Login = lazy(() =>
  import("./pages/Login").then((m) => ({ default: m.Login }))
);
const Signup = lazy(() =>
  import("./pages/Signup").then((m) => ({ default: m.Signup }))
);
const InviteJoin = lazy(() =>
  import("./pages/InviteJoin").then((m) => ({ default: m.InviteJoin }))
);
const KitchenOnboarding = lazy(() =>
  import("./pages/KitchenOnboarding").then((m) => ({
    default: m.KitchenOnboarding,
  }))
);
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const KitchenDashboard = lazy(() =>
  import("./pages/KitchenDashboard").then((m) => ({
    default: m.KitchenDashboard,
  }))
);
const StationView = lazy(() =>
  import("./pages/StationView").then((m) => ({ default: m.StationView }))
);
const KitchenSettings = lazy(() =>
  import("./pages/KitchenSettings").then((m) => ({
    default: m.KitchenSettings,
  }))
);
const TermsOfService = lazy(() =>
  import("./pages/TermsOfService").then((m) => ({
    default: m.TermsOfService,
  }))
);
const PrivacyPolicy = lazy(() =>
  import("./pages/PrivacyPolicy").then((m) => ({
    default: m.PrivacyPolicy,
  }))
);

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950" />
  );
}

function App() {
  const { initialize, user, loading } = useAuthStore();

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        initialize();
      });
    } else {
      const timeoutId = setTimeout(() => {
        initialize();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [initialize]);

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/join/:token" element={<InviteJoin />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Protected routes - require authentication */}
          {user && (
            <>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/kitchen/new" element={<KitchenOnboarding />} />
              <Route
                path="/kitchen/:kitchenId"
                element={<KitchenDashboard />}
              />
              <Route path="/station/:stationId" element={<StationView />} />
              <Route
                path="/kitchen/:kitchenId/settings"
                element={<KitchenSettings />}
              />
            </>
          )}

          {/* Catch all - redirect to landing or dashboard */}
          <Route
            path="*"
            element={<Navigate to={user ? "/dashboard" : "/"} replace />}
          />
        </Routes>
      </Suspense>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
