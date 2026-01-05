import { useState } from "react";
import { captureError } from "@/lib";
import { useDarkModeContext } from "@/context";
import { useStripeCheckout, usePlanLimits } from "@/hooks";
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
  onKitchenUpdated?: () => void;
}

export function KitchenSettingsPanel({
  kitchen,
  membership,
  userId,
  onKitchenDeleted,
  onKitchenUpdated,
}: KitchenSettingsPanelProps) {
  const { isDark } = useDarkModeContext();
  const { handleCheckout } = useStripeCheckout();
  const { limits } = usePlanLimits();

  const [activeTab, setActiveTab] = useState("general");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"stations" | "invites">(
    "stations"
  );

  const isOwner = membership.role === "owner";
  // Owner can invite if they have a pro plan, non-owners check their can_invite permission
  const canInvite = isOwner ? limits?.canInviteAsOwner : membership.can_invite;

  return (
    <div data-testid="kitchen-settings-panel">
      <h2
        className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 truncate ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {kitchen.name}
      </h2>

      <Card padding="none" className="overflow-hidden">
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
                onUpdated={onKitchenUpdated}
              />
            </div>
          </TabPanel>

          <TabPanel value="schedule">
            <div data-testid="schedule-tab-content">
              <ScheduleSettingsTab kitchenId={kitchen.id} isOwner={isOwner} />
            </div>
          </TabPanel>

          <TabPanel value="stations">
            <div data-testid="stations-tab-content">
              <StationsSettingsTab
                kitchenId={kitchen.id}
                isOwner={isOwner}
                onUpgradeClick={() => {
                  setUpgradeReason("stations");
                  setShowUpgradeModal(true);
                }}
              />
            </div>
          </TabPanel>

          <TabPanel value="members">
            <div data-testid="members-tab-content">
              <MembersSettingsTab
                kitchenId={kitchen.id}
                userId={userId}
                isOwner={isOwner}
                canInvite={!!canInvite}
                onInviteClick={() => {
                  if (canInvite) {
                    setShowInviteModal(true);
                  } else {
                    setUpgradeReason("invites");
                    setShowUpgradeModal(true);
                  }
                }}
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
        title={
          upgradeReason === "invites"
            ? "Invite Your Team"
            : "Unlock Unlimited Stations"
        }
        description={
          upgradeReason === "invites"
            ? "Free accounts cannot invite team members. Upgrade to Pro for $29/month to invite your team and collaborate in real-time."
            : "Your free plan includes 1 station per kitchen. Upgrade to Pro for $29/month to add as many stations as your kitchen needs."
        }
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
            captureError(error as Error, {
              context: "KitchenSettingsPanel.checkout",
            });
          }
        }}
      />
    </div>
  );
}
