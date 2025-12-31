import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useKitchens, useStripeCheckout } from "@/hooks";
import { useDarkModeContext } from "@/context";
import { SettingsSidebar, SettingsLayout } from "@/components/layout";
import { UserIcon, CreditCardIcon, KniferollIcon } from "@/components/icons";
import {
  InviteLinkModal,
  UpgradeModal,
  GeneralSettingsTab,
  ScheduleSettingsTab,
  StationsSettingsTab,
  MembersSettingsTab,
  BillingSettingsTab,
} from "@/components";
import { SettingsFormSection } from "@/components/ui/SettingsFormSection";

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Kitchen Settings Page with Sidebar Layout
 * Tabs: Account Settings, Billing, Kitchen Settings (General, Schedule, Stations, Members)
 */
export function KitchenSettings() {
  const { kitchenId } = useParams<{ kitchenId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const { kitchens, loading } = useKitchens(user?.id);
  const { handleCheckout } = useStripeCheckout();

  // Main sidebar navigation (Account, Billing, Kitchens)
  const [activeSection, setActiveSection] = useState(
    kitchenId ? "kitchens" : "account"
  );

  // Kitchen sub-tabs
  const [activeKitchenTab, setActiveKitchenTab] = useState("general");

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Find the selected kitchen
  const selectedKitchen = kitchens.find((k) => k.id === kitchenId);
  const isOwner =
    selectedKitchen && user && selectedKitchen.owner_id === user.id;

  // Update active section when kitchenId changes
  useEffect(() => {
    if (kitchenId) {
      setActiveSection("kitchens");
    }
  }, [kitchenId]);

  const navigation = [
    {
      name: "Account Settings",
      value: "account",
      icon: UserIcon,
      current: activeSection === "account",
    },
    {
      name: "Billing",
      value: "billing",
      icon: CreditCardIcon,
      current: activeSection === "billing",
    },
  ];

  // Secondary navigation for Kitchen Settings (only show if kitchen selected)
  const kitchenSecondaryNav = selectedKitchen
    ? [
        {
          name: "General",
          value: "general",
          current: activeKitchenTab === "general",
        },
        {
          name: "Schedule",
          value: "schedule",
          current: activeKitchenTab === "schedule",
        },
        {
          name: "Stations",
          value: "stations",
          current: activeKitchenTab === "stations",
        },
        {
          name: "Members",
          value: "members",
          current: activeKitchenTab === "members",
        },
      ]
    : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
      </div>
    );
  }

  // If kitchenId provided but kitchen not found
  if (kitchenId && !selectedKitchen) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Kitchen Not Found
          </h2>
          <button
            onClick={() => navigate("/settings")}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SettingsSidebar
        navigation={navigation}
        onNavigate={(value) => {
          setActiveSection(value);
          if (value !== "kitchens") {
            navigate("/settings");
          }
        }}
        title="Settings"
        kitchens={kitchens}
        selectedKitchenId={kitchenId}
        onKitchenSelect={(id) => navigate(`/settings/kitchen/${id}`)}
        userSection={
          <button
            onClick={() => navigate("/dashboard")}
            className={classNames(
              "flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium w-full rounded-lg transition-colors",
              isDark
                ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <KniferollIcon
              size={20}
              className={isDark ? "text-slate-400" : "text-gray-500"}
            />
            <span>Back to Dashboard</span>
          </button>
        }
      />

      <SettingsLayout
        secondaryNav={
          activeSection === "kitchens" && selectedKitchen
            ? kitchenSecondaryNav
            : undefined
        }
        onSecondaryNavClick={setActiveKitchenTab}
      >
        {/* Account Settings Section */}
        {activeSection === "account" && (
          <div
            className={`divide-y ${
              isDark ? "divide-white/10" : "divide-gray-200"
            }`}
          >
            <SettingsFormSection
              title="Account Information"
              description="Manage your personal account details and preferences."
            >
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Account settings coming soon. This will include profile
                management, email preferences, and notification settings.
              </p>
            </SettingsFormSection>
          </div>
        )}

        {/* Billing Section - available to any logged-in user */}
        {activeSection === "billing" && user && (
          <div
            className={`divide-y ${
              isDark ? "divide-white/10" : "divide-gray-200"
            }`}
          >
            <BillingSettingsTab userId={user.id} />
          </div>
        )}

        {/* Kitchen Settings Section */}
        {activeSection === "kitchens" && selectedKitchen && (
          <div
            className={`divide-y ${
              isDark ? "divide-white/10" : "divide-gray-200"
            }`}
          >
            {activeKitchenTab === "general" && (
              <GeneralSettingsTab
                kitchen={selectedKitchen}
                isOwner={!!isOwner}
                onDeleted={() => navigate("/settings")}
              />
            )}

            {activeKitchenTab === "schedule" && (
              <ScheduleSettingsTab
                kitchenId={selectedKitchen.id}
                isOwner={!!isOwner}
              />
            )}

            {activeKitchenTab === "stations" && (
              <StationsSettingsTab
                kitchenId={selectedKitchen.id}
                isOwner={!!isOwner}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            )}

            {activeKitchenTab === "members" && (
              <MembersSettingsTab
                kitchenId={selectedKitchen.id}
                userId={user?.id}
                isOwner={!!isOwner}
                onInviteClick={() => setShowInviteModal(true)}
              />
            )}
          </div>
        )}

        {/* Kitchen selection prompt */}
        {activeSection === "kitchens" && !selectedKitchen && (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <h2
                className={classNames(
                  "text-xl font-semibold mb-2",
                  isDark ? "text-white" : "text-gray-900"
                )}
              >
                Select a Kitchen
              </h2>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Choose a kitchen from the sidebar to manage its settings
              </p>
            </div>
          </div>
        )}
      </SettingsLayout>

      {showInviteModal && selectedKitchen && (
        <InviteLinkModal
          isOpen={showInviteModal}
          kitchenId={selectedKitchen.id}
          kitchenName={selectedKitchen.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Unlock Unlimited Stations"
        description="Your free plan includes 1 station per kitchen. Upgrade to Pro to add as many stations as your kitchen needs."
        features={[
          "Unlimited stations per kitchen",
          "Invite your team with shareable links",
          "Manage up to 5 kitchens",
          "Real-time collaboration on prep lists",
        ]}
        onUpgrade={async () => {
          try {
            await handleCheckout();
          } catch (error) {
            console.error("Checkout failed:", error);
          }
        }}
      />
    </>
  );
}
