import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { HeaderProvider } from "@/context";
import { useDefaultHeaderConfig } from "@/hooks";
import { Logo, NavLinks, UserAvatarMenu } from "@/components";
import { LayoutShell } from "./LayoutShell";

/**
 * Inner component that sets the default app header.
 * This exists because useDefaultHeaderConfig must be called inside HeaderProvider.
 */
function AppLayoutInner() {
  const navigate = useNavigate();

  // Set default header for app pages (runs once on mount)
  // Individual pages can override this using useHeaderConfig
  useDefaultHeaderConfig({
    startContent: <Logo onClick={() => navigate("/dashboard")} />,
    centerContent: null,
    endContent: <NavLinks end={<UserAvatarMenu />} />,
  });

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
