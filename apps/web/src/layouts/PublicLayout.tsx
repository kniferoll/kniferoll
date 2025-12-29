import { Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { HeaderProvider } from "@/context/HeaderContext";
import { useHeaderConfig } from "@/hooks/useHeader";
import {
  AuthButtons,
  DashboardLink,
  Logo,
  NavLinks,
  PublicFooter,
  UserAvatarMenu,
} from "@/components";
import { LayoutShell } from "./LayoutShell";

/**
 * Inner component that sets the default public header.
 * This exists because useHeaderConfig must be called inside HeaderProvider.
 */
function PublicLayoutInner() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Set default header for public pages
  // Individual pages can override this if needed
  useHeaderConfig(
    {
      startContent: <Logo onClick={() => navigate("/")} />,
      endContent: (
        <NavLinks
          start={user ? <DashboardLink /> : null}
          end={user ? <UserAvatarMenu /> : <AuthButtons />}
        />
      ),
    },
    [user, navigate]
  ); // Re-run when auth state changes

  return (
    <>
      <div className="flex-1">
        <Outlet />
      </div>
      <PublicFooter />
    </>
  );
}

/**
 * PublicLayout wraps all public/marketing pages:
 * - Landing, Login, Signup, Terms, Privacy, InviteJoin
 *
 * These pages are accessible to everyone (logged in or not).
 * The header adapts based on auth state:
 * - Logged out: Shows Login/Sign Up buttons
 * - Logged in: Shows Dashboard link + Avatar menu
 *
 * Pages can override the default header using useHeaderConfig hook.
 */
export function PublicLayout() {
  return (
    <HeaderProvider>
      <LayoutShell>
        <PublicLayoutInner />
      </LayoutShell>
    </HeaderProvider>
  );
}
