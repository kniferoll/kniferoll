import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { useUserSubscription, useStripeCheckout } from "@/hooks";
import { redirectToCustomerPortal } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";
import { SettingsSection } from "../ui/SettingsSection";

interface BillingSettingsTabProps {
  userId: string;
}

export function BillingSettingsTab({ userId }: BillingSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { profile } = useUserSubscription();
  const { handleCheckout, loading: checkoutLoading } = useStripeCheckout();
  const [error, setError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = profile?.plan === "pro";

  const handleUpgrade = async () => {
    setError("");
    try {
      await handleCheckout();
    } catch {
      setError("Failed to start checkout. Please try again.");
    }
  };

  const handleManageSubscription = async () => {
    setError("");
    setPortalLoading(true);
    try {
      await redirectToCustomerPortal({
        userId,
        returnUrl: window.location.href,
      });
    } catch {
      setError("Failed to open customer portal. Please try again.");
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <SettingsSection title="Current Plan">
        <div
          className={`rounded-xl p-6 ${
            isDark ? "bg-slate-800" : "bg-stone-50"
          }`}
        >
          <p
            className={`text-sm mb-2 ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Plan Status
          </p>
          <p
            className={`text-2xl font-bold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {isPro ? "Pro" : "Free"}
          </p>

          {isPro && profile?.subscription_period_end && (
            <p
              className={`text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Renews on{" "}
              {new Date(profile.subscription_period_end).toLocaleDateString()}
            </p>
          )}
        </div>
      </SettingsSection>

      {isPro ? (
        <SettingsSection title="Manage Subscription">
          <Alert variant="success" className="mb-4">
            Your Pro subscription is active
          </Alert>
          <Button
            variant="secondary"
            onClick={handleManageSubscription}
            disabled={portalLoading}
            fullWidth
          >
            {portalLoading ? "Opening portal..." : "Manage Subscription"}
          </Button>
        </SettingsSection>
      ) : (
        <SettingsSection title="Upgrade to Pro">
          <div
            className={`rounded-xl p-4 mb-4 ${
              isDark
                ? "bg-orange-500/10 border border-orange-500/20"
                : "bg-orange-50 border border-orange-100"
            }`}
          >
            <h4
              className={`font-semibold mb-3 ${
                isDark ? "text-orange-400" : "text-orange-600"
              }`}
            >
              Pro Features:
            </h4>
            <ul
              className={`space-y-2 text-sm ${
                isDark ? "text-orange-300" : "text-orange-700"
              }`}
            >
              <li>✓ Up to 5 kitchens</li>
              <li>✓ Unlimited stations per kitchen</li>
              <li>✓ Invite team members</li>
              <li>✓ Real-time collaboration</li>
            </ul>
          </div>
          <Button
            variant="primary"
            onClick={handleUpgrade}
            disabled={checkoutLoading}
            fullWidth
          >
            {checkoutLoading ? "Redirecting..." : "Upgrade to Pro - $29/month"}
          </Button>
        </SettingsSection>
      )}
    </div>
  );
}
