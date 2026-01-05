import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useDarkModeContext } from "@/context";
import { useAuthStore } from "@/stores";
import { useKitchens, useHeaderConfig } from "@/hooks";
import { supabase, captureError } from "@/lib";
import { BackButton, SupportModal } from "@/components";
import {
  SettingsSidebar,
  PersonalSettingsTab,
  KitchenSettingsPanel,
  BillingSettingsTab,
} from "@/components/settings";
import type { Database } from "@kniferoll/types";

type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

function SupportSettingsPanel() {
  const { isDark } = useDarkModeContext();
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  return (
    <div
      className={`rounded-xl p-6 ${isDark ? "bg-slate-900" : "bg-white"}`}
      data-testid="support-panel"
    >
      <h2 className={`text-xl font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
        Support
      </h2>
      <p className={`mb-6 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Have a question, found a bug, or want to request a feature? We&apos;re here to help.
      </p>

      <button
        onClick={() => setIsSupportModalOpen(true)}
        className={`px-6 py-3 rounded-xl font-medium transition-colors cursor-pointer ${
          isDark
            ? "bg-orange-500 hover:bg-orange-600 text-white"
            : "bg-orange-500 hover:bg-orange-600 text-white"
        }`}
      >
        Contact Support
      </button>

      <SupportModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark } = useDarkModeContext();
  const { user } = useAuthStore();
  const { kitchens, loading: kitchensLoading } = useKitchens(user?.id);

  // Get initial section from URL params or navigation state (for backwards compatibility)
  const urlSection = searchParams.get("section");
  const locationSection = (location.state as { section?: string } | null)?.section;
  const initialSection = urlSection || locationSection || "personal";
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [memberships, setMemberships] = useState<KitchenMember[]>([]);
  const [membershipsLoading, setMembershipsLoading] = useState(true);

  // Update section when URL params or navigation state changes
  useEffect(() => {
    const newSection = urlSection || locationSection;
    if (newSection) {
      setActiveSection(newSection);
    }
  }, [urlSection, locationSection]);

  // Update URL when section changes (keeps URL in sync with state)
  const handleSectionChange = (newSection: string) => {
    setActiveSection(newSection);
    setSearchParams({ section: newSection }, { replace: true });
  };

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
        captureError(err as Error, { context: "Settings.fetchMemberships" });
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
        <span className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
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
  const selectedMembership = memberships.find((m) => m.kitchen_id === activeSection);

  // Filter to only show kitchens where user is owner or admin
  const manageableKitchens = kitchens.filter((kitchen) => {
    const membership = memberships.find((m) => m.kitchen_id === kitchen.id);
    return membership?.role === "owner" || membership?.role === "admin";
  });

  const handleKitchenDeleted = () => {
    handleSectionChange("personal");
  };

  // Mobile nav pill button styles
  const getMobilePillClass = (isActive: boolean) => {
    const base =
      "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap";
    if (isActive) {
      return `${base} ${
        isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"
      }`;
    }
    return `${base} ${
      isDark
        ? "bg-slate-800 text-gray-400 hover:text-white"
        : "bg-stone-100 text-gray-600 hover:text-gray-900"
    }`;
  };

  return (
    <div data-testid="page-settings">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Mobile Navigation */}
        <div className="md:hidden mb-6">
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-2">
              {/* Account section pills */}
              <button
                onClick={() => handleSectionChange("personal")}
                className={getMobilePillClass(activeSection === "personal")}
              >
                Personal
              </button>
              <button
                onClick={() => handleSectionChange("billing")}
                className={getMobilePillClass(activeSection === "billing")}
              >
                Billing
              </button>
              <button
                onClick={() => handleSectionChange("support")}
                className={getMobilePillClass(activeSection === "support")}
              >
                Support
              </button>

              {/* Divider */}
              {manageableKitchens.length > 0 && (
                <div
                  className={`flex-shrink-0 w-px mx-1 ${isDark ? "bg-slate-700" : "bg-stone-300"}`}
                />
              )}

              {/* Kitchen pills */}
              {manageableKitchens.map((kitchen) => (
                <button
                  key={kitchen.id}
                  onClick={() => handleSectionChange(kitchen.id)}
                  className={getMobilePillClass(activeSection === kitchen.id)}
                >
                  {kitchen.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar - Hidden on mobile */}
          <div className="hidden md:block">
            <SettingsSidebar
              activeSection={activeSection}
              onSectionChange={handleSectionChange}
              kitchens={kitchens}
              memberships={memberships}
            />
          </div>

          {/* Content */}
          <div data-testid="settings-content" className="flex-1 min-w-0 md:max-w-3xl">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Loading...</p>
              </div>
            ) : activeSection === "personal" ? (
              <PersonalSettingsTab user={user} />
            ) : activeSection === "billing" ? (
              <div data-testid="billing-settings-panel">
                <BillingSettingsTab userId={user.id} />
              </div>
            ) : activeSection === "support" ? (
              <div data-testid="support-settings-panel">
                <SupportSettingsPanel />
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
