import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useDarkModeContext, HeaderProvider } from "@/context";
import { useHeaderConfig } from "@/hooks";
import {
  AuthButtons,
  DashboardLink,
  Logo,
  NavLinks,
  PublicFooter,
  PublicMobileMenu,
  UserAvatarMenu,
} from "@/components";
import { LayoutShell } from "./LayoutShell";

function PricingLink() {
  const { isDark } = useDarkModeContext();
  return (
    <Link
      to="/pricing"
      className={`text-sm font-medium transition-colors hover:text-orange-500 ${
        isDark ? "text-gray-300" : "text-gray-700"
      }`}
    >
      Pricing
    </Link>
  );
}

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
        <>
          {/* Desktop navigation */}
          <div className="hidden md:block">
            <NavLinks
              start={
                <>
                  <PricingLink />
                  {user ? <DashboardLink /> : null}
                </>
              }
              end={user ? <UserAvatarMenu /> : <AuthButtons />}
            />
          </div>
          {/* Mobile navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <PublicMobileMenu />
            {user && <UserAvatarMenu />}
          </div>
        </>
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
