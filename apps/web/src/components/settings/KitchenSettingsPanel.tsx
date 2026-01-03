import { useState } from "react";
import { useDarkModeContext } from "@/context";
import { useStripeCheckout } from "@/hooks";
import {
  Card,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  InviteLinkModal,
  UpgradeModal,
} from "@/components";
import { GeneralSettingsTab } from "./GeneralSettingsTab";
import { ScheduleSettingsTab } from "./ScheduleSettingsTab";
import { StationsSettingsTab } from "./StationsSettingsTab";
import { MembersSettingsTab } from "./MembersSettingsTab";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];
type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

interface KitchenSettingsPanelProps {
  kitchen: Kitchen;
  membership: KitchenMember;
  userId: string;
  onKitchenDeleted?: () => void;
}

export function KitchenSettingsPanel({
  kitchen,
  membership,
  userId,
  onKitchenDeleted,
}: KitchenSettingsPanelProps) {
  const { isDark } = useDarkModeContext();
  const { handleCheckout } = useStripeCheckout();

  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isOwner = membership.role === "owner";

  return (
    <div data-testid="kitchen-settings-panel">
      <h2
        className={`text-xl font-bold mb-6 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {kitchen.name}
      </h2>

      <Card padding="none">
        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabList>
            <Tab value="general">General</Tab>
            <Tab value="schedule">Schedule</Tab>
            <Tab value="stations">Stations</Tab>
            <Tab value="members">Members</Tab>
          </TabList>

          <TabPanel value="general">
            <div data-testid="general-tab-content">
              <GeneralSettingsTab
                kitchen={kitchen}
                isOwner={isOwner}
                onDeleted={onKitchenDeleted || (() => {})}
              />
            </div>
          </TabPanel>

          <TabPanel value="schedule">
            <div data-testid="schedule-tab-content">
              <ScheduleSettingsTab
                kitchenId={kitchen.id}
                isOwner={isOwner}
              />
            </div>
          </TabPanel>

          <TabPanel value="stations">
            <div data-testid="stations-tab-content">
              <StationsSettingsTab
                kitchenId={kitchen.id}
                isOwner={isOwner}
                onUpgradeClick={() => setShowUpgradeModal(true)}
              />
            </div>
          </TabPanel>

          <TabPanel value="members">
            <div data-testid="members-tab-content">
              <MembersSettingsTab
                kitchenId={kitchen.id}
                userId={userId}
                isOwner={isOwner}
                onInviteClick={() => setShowInviteModal(true)}
              />
            </div>
          </TabPanel>
        </Tabs>
      </Card>

      <InviteLinkModal
        isOpen={showInviteModal}
        kitchenId={kitchen.id}
        kitchenName={kitchen.name}
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
