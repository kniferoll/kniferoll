import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchens } from "../hooks/useKitchens";
import { usePlanLimits, usePaywall } from "../hooks/usePlanLimits";
import { useStripeCheckout } from "../hooks/useStripeCheckout";
import { CenteredPage } from "../components/CenteredPage";
import { Button } from "../components/Button";
import { UpgradeModal } from "../components/UpgradeModal";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { kitchens, loading } = useKitchens(user?.id);
  const { limits } = usePlanLimits();
  const { showPaywall, showKitchenPaywall, closePaywall } = usePaywall();
  const { handleCheckout } = useStripeCheckout();
  const [lastKitchenId, setLastKitchenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load last accessed kitchen from localStorage
  useEffect(() => {
    if (user) {
      const lastId = localStorage.getItem("kniferoll_last_kitchen");
      setLastKitchenId(lastId);
    }
  }, [user]);

  // Auto-navigate to last kitchen if only one exists
  useEffect(() => {
    if (kitchens.length === 1 && lastKitchenId === kitchens[0].id) {
      navigate(`/kitchen/${kitchens[0].id}`);
    }
  }, [kitchens, lastKitchenId, navigate]);

  const handleSelectKitchen = (kitchen: Kitchen) => {
    localStorage.setItem("kniferoll_last_kitchen", kitchen.id);
    navigate(`/kitchen/${kitchen.id}`);
  };

  const handleCreateKitchen = () => {
    // Avoid false paywall before limits load
    if (!limits) {
      return; // optionally show a loading state
    }
    if (!limits.canCreateKitchen) {
      showKitchenPaywall();
      return;
    }
    navigate("/create-kitchen");
  };

  if (loading) {
    return (
      <CenteredPage>
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Loading kitchens...
          </p>
        </div>
      </CenteredPage>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Kitchens
          </h1>
          <p className="text-gray-600 dark:text-gray-400">{user?.email}</p>
        </div>

        {kitchens.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-12 text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No kitchens yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first kitchen to get started
            </p>
            <Button
              onClick={handleCreateKitchen}
              disabled={loading || !limits}
              className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Create Kitchen
            </Button>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {kitchens.map((kitchen) => (
                <button
                  key={kitchen.id}
                  onClick={() => handleSelectKitchen(kitchen)}
                  className="text-left bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {kitchen.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {kitchen.owner_id === user?.id ? "Owner" : "Member"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-blue-600 dark:text-blue-400 font-semibold">
                      View Kitchen →
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {limits?.canCreateKitchen && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Create Another Kitchen
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Manage multiple kitchens with your account
                </p>
                <Button
                  onClick={handleCreateKitchen}
                  disabled={loading || !limits}
                  variant="primary"
                >
                  Create New Kitchen
                </Button>
              </div>
            )}

            {!limits?.canCreateKitchen && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Upgrade to Create More Kitchens
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You've reached the maximum number of kitchens for your plan (
                  {limits?.ownedKitchens}/{limits?.maxKitchens}). Upgrade to Pro
                  to create more.
                </p>
                <Button
                  onClick={showKitchenPaywall}
                  variant="outline"
                  className="border-amber-300 dark:border-amber-700"
                >
                  Upgrade to Pro
                </Button>
              </div>
            )}
          </div>
        )}

        {showPaywall && (
          <UpgradeModal
            title="Upgrade to Pro"
            description="Create unlimited kitchens and invite team members to collaborate."
            features={[
              "Unlimited kitchens",
              "Unlimited stations per kitchen",
              "Invite team members",
              "Real-time collaboration",
            ]}
            onUpgrade={async () => {
              try {
                await handleCheckout();
              } catch (error) {
                console.error("Checkout failed:", error);
                // Modal will stay open so user can try again
              }
            }}
            onCancel={closePaywall}
          />
        )}
      </div>
    </div>
  );
}
