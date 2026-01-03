import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { useAuthStore } from "@/stores";
import { useKitchens, useHeaderConfig } from "@/hooks";
import { supabase } from "@/lib";
import { BackButton } from "@/components";
import {
  SettingsSidebar,
  PersonalSettingsTab,
  KitchenSettingsPanel,
  BillingSettingsTab,
} from "@/components/settings";
import type { Database } from "@kniferoll/types";

type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

export function Settings() {
  const navigate = useNavigate();
  const { isDark } = useDarkModeContext();
  const { user } = useAuthStore();
  const { kitchens, loading: kitchensLoading } = useKitchens(user?.id);

  const [activeSection, setActiveSection] = useState<string>("personal");
  const [memberships, setMemberships] = useState<KitchenMember[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);

  // Fetch memberships for all kitchens
  useEffect(() => {
    const fetchMemberships = async () => {
      if (!user?.id || kitchens.length === 0) {
        setMemberships([]);
        setMembershipsLoading(false);
        return;
      }

      try {
        const kitchenIds = kitchens.map((k) => k.id);
        const { data, error } = await supabase
          .from("kitchen_members")
          .select("*")
          .eq("user_id", user.id)
          .in("kitchen_id", kitchenIds);

        if (error) throw error;
        setMemberships(data || []);
      } catch (err) {
        console.error("Failed to fetch memberships:", err);
      } finally {
        setMembershipsLoading(false);
      }
    };

    fetchMemberships();
  }, [user?.id, kitchens]);

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
          Settings
        </span>
      ),
    },
    [isDark, navigate]
  );

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  const loading = kitchensLoading || membershipsLoading;

  // Get the selected kitchen and membership for kitchen panels
  const selectedKitchen = kitchens.find((k) => k.id === activeSection);
  const selectedMembership = memberships.find(
    (m) => m.kitchen_id === activeSection
  );

  const handleKitchenDeleted = () => {
    setActiveSection("personal");
  };

  return (
    <div data-testid="page-settings">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            kitchens={kitchens}
            memberships={memberships}
          />

          {/* Content */}
          <div
            data-testid="settings-content"
            className="flex-1 max-w-3xl"
          >
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Loading...
                </p>
              </div>
            ) : activeSection === "personal" ? (
              <PersonalSettingsTab user={user} />
            ) : activeSection === "billing" ? (
              <div data-testid="billing-settings-panel">
                <BillingSettingsTab userId={user.id} />
              </div>
            ) : selectedKitchen && selectedMembership ? (
              <KitchenSettingsPanel
                kitchen={selectedKitchen}
                membership={selectedMembership}
                userId={user.id}
                onKitchenDeleted={handleKitchenDeleted}
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Select a section from the sidebar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
