import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { useUserSubscription, useStripeCheckout, usePlanLimits } from "@/hooks";
import { redirectToCustomerPortal } from "@/lib";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

interface BillingSettingsTabProps {
  userId: string;
}

export function BillingSettingsTab({ userId }: BillingSettingsTabProps) {
  const { isDark } = useDarkModeContext();
  const { profile, loading: profileLoading } = useUserSubscription();
  const { limits } = usePlanLimits();
  const { handleCheckout, loading: checkoutLoading } = useStripeCheckout();
  const [error, setError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);

  const isPro = profile?.plan === "pro";
  // Only wait for profile, not limits (limits are optional display data)
  const isLoading = profileLoading;

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

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div
          className={`animate-pulse text-sm ${
            isDark ? "text-slate-400" : "text-gray-500"
          }`}
        >
          Loading billing information...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-6">
        <Alert variant="error">
          Unable to load billing information. Please try refreshing the page.
        </Alert>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Plan Status Card */}
      <div
        className={`relative overflow-hidden rounded-2xl ${
          isPro
            ? isDark
              ? "bg-gradient-to-br from-orange-500/20 via-orange-600/10 to-transparent border border-orange-500/30"
              : "bg-gradient-to-br from-orange-50 via-orange-100/50 to-white border border-orange-200"
            : isDark
            ? "bg-slate-800/80 border border-slate-700"
            : "bg-stone-50 border border-stone-200"
        }`}
      >
        {/* Decorative gradient orb for Pro */}
        {isPro && (
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-400/30 to-orange-600/10 rounded-full blur-3xl" />
        )}

        <div className="relative p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${
                  isDark ? "text-slate-400" : "text-gray-500"
                }`}
              >
                Current Plan
              </p>
              <div className="flex items-center gap-3">
                <h2
                  className={`text-3xl font-bold ${
                    isPro
                      ? isDark
                        ? "text-orange-400"
                        : "text-orange-600"
                      : isDark
                      ? "text-white"
                      : "text-gray-900"
                  }`}
                >
                  {isPro ? "Pro" : "Free"}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPro
                      ? isDark
                        ? "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30"
                        : "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
                      : isDark
                      ? "bg-slate-700 text-slate-300 ring-1 ring-slate-600"
                      : "bg-stone-200 text-stone-600 ring-1 ring-stone-300"
                  }`}
                >
                  {isPro ? "Active" : "Basic"}
                </span>
              </div>
            </div>

            {isPro && (
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                  isDark ? "bg-orange-500/20" : "bg-orange-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    isDark ? "text-orange-400" : "text-orange-600"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
            )}
          </div>

          {isPro && profile?.subscription_period_end && (
            <div className="mt-4 pt-4 border-t border-orange-500/20">
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-gray-600"
                }`}
              >
                <span className="font-medium">Next renewal:</span>{" "}
                {new Date(profile.subscription_period_end).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
            </div>
          )}

          {!isPro && (
            <p
              className={`mt-3 text-sm ${
                isDark ? "text-slate-400" : "text-gray-500"
              }`}
            >
              Upgrade to Pro to unlock unlimited kitchens, stations, and team
              collaboration features.
            </p>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      {limits && (
        <div>
          <h3
            className={`text-sm font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Your Usage
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kitchens Usage */}
            <div
              className={`rounded-xl p-5 ${
                isDark
                  ? "bg-slate-800/60 border border-slate-700"
                  : "bg-white border border-stone-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                    isDark ? "bg-blue-500/20" : "bg-blue-50"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      isDark ? "text-blue-400" : "text-blue-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Kitchens
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {limits.ownedKitchens}
                </span>
                <span
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  / {limits.maxKitchens === Infinity ? "∞" : limits.maxKitchens}
                </span>
              </div>
              {!isPro && limits.ownedKitchens >= limits.maxKitchens && (
                <p
                  className={`mt-2 text-xs ${
                    isDark ? "text-amber-400" : "text-amber-600"
                  }`}
                >
                  Upgrade to add more kitchens
                </p>
              )}
            </div>

            {/* Stations Usage */}
            <div
              className={`rounded-xl p-5 ${
                isDark
                  ? "bg-slate-800/60 border border-slate-700"
                  : "bg-white border border-stone-200"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${
                    isDark ? "bg-purple-500/20" : "bg-purple-50"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    className={`text-sm font-medium ${
                      isDark ? "text-slate-300" : "text-gray-700"
                    }`}
                  >
                    Stations per Kitchen
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-2xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {limits.maxStationsPerKitchen === Infinity
                    ? "Unlimited"
                    : limits.maxStationsPerKitchen}
                </span>
              </div>
              {!isPro && (
                <p
                  className={`mt-2 text-xs ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  Pro gives you unlimited stations
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pro Features / Upgrade Section */}
      {isPro ? (
        <div>
          <h3
            className={`text-sm font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Manage Subscription
          </h3>
          <div
            className={`rounded-xl p-5 ${
              isDark
                ? "bg-slate-800/60 border border-slate-700"
                : "bg-white border border-stone-200"
            }`}
          >
            <p
              className={`text-sm mb-4 ${
                isDark ? "text-slate-400" : "text-gray-600"
              }`}
            >
              Access your Stripe customer portal to update payment methods, view
              invoices, or cancel your subscription.
            </p>
            <Button
              variant="secondary"
              onClick={handleManageSubscription}
              disabled={portalLoading}
            >
              {portalLoading ? "Opening portal..." : "Manage Billing"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <h3
            className={`text-sm font-semibold mb-4 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Upgrade to Pro
          </h3>
          <div
            className={`rounded-2xl overflow-hidden ${
              isDark
                ? "bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700"
                : "bg-gradient-to-br from-white to-stone-50 border border-stone-200"
            }`}
          >
            <div className="p-6">
              <div className="flex items-baseline gap-2 mb-6">
                <span
                  className={`text-4xl font-bold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  $9
                </span>
                <span
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-gray-500"
                  }`}
                >
                  / month
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {[
                  { icon: "🏠", text: "Up to 5 kitchens" },
                  { icon: "📍", text: "Unlimited stations per kitchen" },
                  { icon: "👥", text: "Invite unlimited team members" },
                  { icon: "⚡", text: "Real-time collaboration" },
                  { icon: "📊", text: "Priority support" },
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-lg">{feature.icon}</span>
                    <span
                      className={`text-sm ${
                        isDark ? "text-slate-300" : "text-gray-700"
                      }`}
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant="primary"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                fullWidth
                size="lg"
              >
                {checkoutLoading ? "Redirecting..." : "Upgrade to Pro"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
