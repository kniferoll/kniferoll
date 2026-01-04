import { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuthStore } from "./stores/authStore";
import { PublicLayout, AppLayout } from "./layouts";
import { ScrollToTop } from "./components";

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
const JoinWithCode = lazy(() =>
  import("./pages/JoinWithCode").then((m) => ({ default: m.JoinWithCode }))
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
    <div
      className="min-h-screen bg-linear-to-br from-amber-50 via-amber-50/80 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    />
  );
}

function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen p-4 bg-linear-to-br from-amber-50 via-amber-50/80 to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      style={{
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <h1 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        We've been notified and are looking into it.
      </p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
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
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/*
              Public routes - accessible to everyone
              Uses PublicLayout with marketing header/footer
            */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/join" element={<JoinWithCode />} />
              <Route path="/join/:token" element={<InviteJoin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
            </Route>

          {/* 
            App routes - require authentication
            Uses AppLayout which redirects to /login if not authenticated
            Each page can customize the header via useHeaderConfig
          */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kitchen/:kitchenId" element={<KitchenDashboard />} />
            <Route path="/station/:stationId" element={<StationView />} />
            <Route path="/settings" element={<KitchenSettings />} />
            <Route
              path="/settings/kitchen/:kitchenId"
              element={<KitchenSettings />}
            />
          </Route>

            {/* Catch all - redirect to landing or dashboard */}
            <Route
              path="*"
              element={<Navigate to={user ? "/dashboard" : "/"} replace />}
            />
          </Routes>
        </Suspense>
        <Analytics />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

export default App;
