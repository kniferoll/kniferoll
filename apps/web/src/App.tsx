import { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { Analytics } from "@vercel/analytics/react";
import { useAuthStore } from "./stores/authStore";
import { PublicLayout, AppLayout } from "./layouts";
import { ScrollToTop } from "./components";
import { lazyWithRetry } from "./lib";

// Lazy load pages with retry on chunk load failure
const Landing = lazyWithRetry(() =>
  import("./pages/Landing").then((m) => ({ default: m.Landing }))
);
const Login = lazyWithRetry(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Signup = lazyWithRetry(() => import("./pages/Signup").then((m) => ({ default: m.Signup })));
const InviteJoin = lazyWithRetry(() =>
  import("./pages/InviteJoin").then((m) => ({ default: m.InviteJoin }))
);
const JoinWithCode = lazyWithRetry(() =>
  import("./pages/JoinWithCode").then((m) => ({ default: m.JoinWithCode }))
);
const Dashboard = lazyWithRetry(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard }))
);
const KitchenDashboard = lazyWithRetry(() =>
  import("./pages/KitchenDashboard").then((m) => ({
    default: m.KitchenDashboard,
  }))
);
const StationView = lazyWithRetry(() =>
  import("./pages/StationView").then((m) => ({ default: m.StationView }))
);
const Settings = lazyWithRetry(() =>
  import("./pages/Settings").then((m) => ({
    default: m.Settings,
  }))
);
// Legal, help, and pricing pages loaded eagerly for instant access (SEO/compliance critical)
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { HelpCenter } from "./pages/HelpCenter";
import { Pricing } from "./pages/Pricing";
const ForgotPassword = lazyWithRetry(() =>
  import("./pages/ForgotPassword").then((m) => ({
    default: m.ForgotPassword,
  }))
);
const ResetPassword = lazyWithRetry(() =>
  import("./pages/ResetPassword").then((m) => ({
    default: m.ResetPassword,
  }))
);
const VerifyEmail = lazyWithRetry(() =>
  import("./pages/VerifyEmail").then((m) => ({
    default: m.VerifyEmail,
  }))
);
const NotFound = lazyWithRetry(() =>
  import("./pages/NotFound").then((m) => ({
    default: m.NotFound,
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

// Redirect old kitchen settings URLs to new unified settings with search param
function KitchenSettingsRedirect() {
  const { kitchenId } = useParams<{ kitchenId: string }>();
  return <Navigate to={`/settings?section=${kitchenId}`} replace />;
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
  const { initialize, loading } = useAuthStore();

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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/join" element={<JoinWithCode />} />
              <Route path="/join/:token" element={<InviteJoin />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/pricing" element={<Pricing />} />
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
              <Route path="/settings" element={<Settings />} />
              {/* Redirect old kitchen settings to new unified settings with section param */}
              <Route path="/kitchen/:kitchenId/settings" element={<KitchenSettingsRedirect />} />
            </Route>

            {/* 404 - Page not found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Analytics />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
}

export default App;
