import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { useKitchen, useStripeCheckout } from "@/hooks";
import { useHeaderConfig } from "@/hooks";
import { useDarkModeContext } from "@/context";
import {
  BackButton,
  Button,
  Card,
  InviteLinkModal,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  UpgradeModal,
  GeneralSettingsTab,
  ScheduleSettingsTab,
  StationsSettingsTab,
  MembersSettingsTab,
  BillingSettingsTab,
} from "@/components";

export function KitchenSettings() {
  const { kitchenId } = useParams<{ kitchenId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { isDark } = useDarkModeContext();
  const { kitchen, loading } = useKitchen(kitchenId);
  const { handleCheckout } = useStripeCheckout();

  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isOwner = kitchen && user && kitchen.owner_id === user.id;

  // Configure header
  useHeaderConfig(
    {
      startContent: <BackButton onClick={() => navigate(-1)} label="Back" />,
      centerContent: (
        <span
          className={`text-lg font-semibold ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {kitchen?.name || "Kitchen"} Settings
        </span>
      ),
    },
    [kitchen?.name, isDark, navigate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
      </div>
    );
  }

  if (!kitchen || !kitchenId) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Card padding="lg">
          <h2
            className={`text-xl font-semibold mb-2 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Kitchen Not Found
          </h2>
          <p className={`mb-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            Could not load kitchen settings
          </p>
          <Button variant="primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div data-testid="page-kitchen-settings">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card padding="none">
          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="general">General</Tab>
              <Tab value="schedule">Schedule</Tab>
              <Tab value="stations">Stations</Tab>
              <Tab value="members">Members</Tab>
              {isOwner && <Tab value="billing">Billing</Tab>}
            </TabList>

            <TabPanel value="general">
              <GeneralSettingsTab
                kitchen={kitchen}
                isOwner={!!isOwner}
                onDeleted={() => navigate("/dashboard")}
              />
            </TabPanel>

            <TabPanel value="schedule">
              <ScheduleSettingsTab kitchenId={kitchenId} isOwner={!!isOwner} />
            </TabPanel>

            <TabPanel value="stations">
              <StationsSettingsTab
                kitchenId={kitchenId}
                isOwner={!!isOwner}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            </TabPanel>

            <TabPanel value="members">
              <MembersSettingsTab
                kitchenId={kitchenId}
                userId={user?.id}
                isOwner={!!isOwner}
                onInviteClick={() => setShowInviteModal(true)}
              />
            </TabPanel>

            {isOwner && (
              <TabPanel value="billing">
                <BillingSettingsTab userId={user!.id} />
              </TabPanel>
            )}
          </Tabs>
        </Card>
      </div>

      <InviteLinkModal
        isOpen={showInviteModal && !!kitchen}
        kitchenId={kitchen?.id || ""}
        kitchenName={kitchen?.name || ""}
        onClose={() => setShowInviteModal(false)}
      />

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
    </div>
  );
}
