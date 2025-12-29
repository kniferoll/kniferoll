import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { HeaderProvider } from "../context/HeaderContext";
import { useHeaderConfig } from "../hooks/useHeader";
import { Logo } from "../components/Logo";
import { NavLinks } from "../components/NavLinks";
import { UserAvatarMenu } from "../components/UserAvatarMenu";
import { LayoutShell } from "./LayoutShell";

/**
 * Inner component that sets the default app header.
 * This exists because useHeaderConfig must be called inside HeaderProvider.
 */
function AppLayoutInner() {
  const navigate = useNavigate();

  // Set default header for app pages
  // Individual pages (like StationView) can override this
  useHeaderConfig(
    {
      startContent: <Logo onClick={() => navigate("/dashboard")} />,
      endContent: <NavLinks end={<UserAvatarMenu />} />,
    },
    [navigate]
  );

  return <Outlet />;
}

/**
 * AppLayout wraps all authenticated/app pages:
 * - Dashboard, KitchenDashboard, StationView, KitchenSettings
 *
 * These pages require authentication.
 * Redirects to /login if not authenticated.
 *
 * Each page can customize the header using useHeaderConfig hook.
 * For example, StationView sets its own header with DateCalendar and ShiftToggle.
 */
export function AppLayout() {
  const { user } = useAuthStore();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <HeaderProvider>
      <LayoutShell>
        <AppLayoutInner />
      </LayoutShell>
    </HeaderProvider>
  );
}
