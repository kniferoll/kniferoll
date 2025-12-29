import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useKitchens, usePlanLimits, useStripeCheckout } from "@/hooks";
import { useDarkModeContext } from "@/context";
import {
  AddCard,
  Button,
  Card,
  KitchenCard,
  KitchenOnboardingModal,
  UpgradeModal,
} from "@/components";
import type { Database } from "@kniferoll/types";
import { preloadKitchenDashboard } from "@/lib/preload";
type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

/**
 * Dashboard page - list of user's kitchens
 *
 * Uses the default header from AppLayout (Logo + UserAvatarMenu).
 */
export function Dashboard() {
  useEffect(() => {
    preloadKitchenDashboard();
  }, []);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { kitchens, loading } = useKitchens(user?.id);
  const { limits } = usePlanLimits();
  const { handleCheckout } = useStripeCheckout();
  const { isDark } = useDarkModeContext();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  // Close settings menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-settings-menu]")) {
        setSettingsMenuOpen(null);
      }
    };

    if (settingsMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [settingsMenuOpen]);

  const handleSelectKitchen = (kitchen: Kitchen) => {
    localStorage.setItem("kniferoll_last_kitchen", kitchen.id);
    navigate(`/kitchen/${kitchen.id}`);
  };

  const handleCreateKitchen = () => {
    if (!limits) return;
    if (!limits.canCreateKitchen) {
      setUpgradeModalOpen(true);
      return;
    }
    setOnboardingModalOpen(true);
  };

  const handleKitchenCreated = (kitchenId: string) => {
    setOnboardingModalOpen(false);
    localStorage.setItem("kniferoll_last_kitchen", kitchenId);
    navigate(`/kitchen/${kitchenId}`);
  };

  const canAddKitchen = limits?.canCreateKitchen ?? false;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Loading kitchens...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl w-full mx-auto px-8 py-10 pb-20">
        <h1
          className={`text-3xl font-semibold tracking-tight mb-2 cursor-default ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          Your Kitchens
        </h1>
        <p
          className={`text-sm mb-10 cursor-default ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Select a kitchen to manage prep lists and team
        </p>

        {kitchens.length === 0 ? (
          /* Empty State */
          <Card variant="dashed" padding="none" className="p-16 text-center">
            <h2
              className={`text-2xl font-semibold mb-2 cursor-default ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              No kitchens yet
            </h2>
            <p
              className={`mb-8 cursor-default ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Create your first kitchen to get started
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreateKitchen}
              disabled={loading || !limits}
            >
              Create Kitchen
            </Button>
          </Card>
        ) : (
          /* Kitchen Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {kitchens.map((kitchen) => (
              <KitchenCard
                key={kitchen.id}
                name={kitchen.name}
                onClick={() => handleSelectKitchen(kitchen)}
                showMenu={settingsMenuOpen === kitchen.id}
                onMenuToggle={() =>
                  setSettingsMenuOpen(
                    settingsMenuOpen === kitchen.id ? null : kitchen.id
                  )
                }
                menuContent={
                  <>
                    {["Kitchen Settings", "Manage Shifts", "Team Members"].map(
                      (item) => (
                        <button
                          key={item}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettingsMenuOpen(null);
                            if (item === "Kitchen Settings") {
                              navigate(`/kitchen/${kitchen.id}/settings`);
                            }
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors cursor-pointer ${
                            isDark
                              ? "text-gray-300 hover:bg-slate-700"
                              : "text-gray-700 hover:bg-stone-100"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}
                  </>
                }
              />
            ))}

            <AddCard
              label={
                canAddKitchen ? "Create New Kitchen" : "Add Another Kitchen"
              }
              onClick={() => {
                if (canAddKitchen) {
                  handleCreateKitchen();
                } else {
                  setUpgradeModalOpen(true);
                }
              }}
              disabled={!canAddKitchen}
              disabledLabel="Pro Feature"
            />
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Manage Multiple Kitchens"
        description="Running prep at more than one spot? Pro lets you manage unlimited kitchens from one account—switch between venues without logging out."
        onUpgrade={async () => {
          try {
            await handleCheckout();
          } catch (error) {
            console.error("Checkout failed:", error);
          }
        }}
      />

      {/* Kitchen Onboarding Modal */}
      <KitchenOnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        onSuccess={handleKitchenCreated}
      />
    </>
  );
}
