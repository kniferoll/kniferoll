import { useDarkModeContext } from "@/context";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];
type KitchenMember = Database["public"]["Tables"]["kitchen_members"]["Row"];

export type ActiveSettingsSection = "personal" | "billing" | string;

interface SettingsSidebarProps {
  activeSection: ActiveSettingsSection;
  onSectionChange: (section: ActiveSettingsSection) => void;
  kitchens: Kitchen[];
  memberships: KitchenMember[];
}

export function SettingsSidebar({
  activeSection,
  onSectionChange,
  kitchens,
  memberships,
}: SettingsSidebarProps) {
  const { isDark } = useDarkModeContext();

  // Filter to only show kitchens where user is owner or admin
  const manageableKitchens = kitchens.filter((kitchen) => {
    const membership = memberships.find((m) => m.kitchen_id === kitchen.id);
    return membership?.role === "owner" || membership?.role === "admin";
  });

  const baseButtonClass = `w-full text-left px-4 py-3 rounded-xl font-medium transition-colors cursor-pointer`;

  const getButtonClass = (isActive: boolean) => {
    if (isActive) {
      return `${baseButtonClass} ${
        isDark
          ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
          : "bg-orange-50 text-orange-600 border border-orange-100"
      }`;
    }
    return `${baseButtonClass} ${
      isDark
        ? "text-gray-400 hover:bg-slate-800 hover:text-white"
        : "text-gray-600 hover:bg-stone-100 hover:text-gray-900"
    }`;
  };

  return (
    <nav
      data-testid="settings-sidebar"
      className={`w-64 flex-shrink-0 p-4 rounded-xl ${isDark ? "bg-slate-900" : "bg-white"}`}
    >
      <div className="space-y-6">
        {/* Account Section */}
        <div>
          <h3
            className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Account
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => onSectionChange("personal")}
              className={getButtonClass(activeSection === "personal")}
              aria-selected={activeSection === "personal"}
              role="button"
            >
              Personal
            </button>
            <button
              onClick={() => onSectionChange("billing")}
              className={getButtonClass(activeSection === "billing")}
              aria-selected={activeSection === "billing"}
              role="button"
            >
              Billing
            </button>
            <button
              onClick={() => onSectionChange("support")}
              className={getButtonClass(activeSection === "support")}
              aria-selected={activeSection === "support"}
              role="button"
            >
              Support
            </button>
          </div>
        </div>

        {/* Kitchens Section */}
        <div>
          <h3
            className={`text-xs font-semibold uppercase tracking-wider mb-2 px-4 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Kitchens
          </h3>
          <div className="space-y-1">
            {manageableKitchens.length === 0 ? (
              <p className={`px-4 py-2 text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                No kitchens to manage
              </p>
            ) : (
              manageableKitchens.map((kitchen) => (
                <button
                  key={kitchen.id}
                  onClick={() => onSectionChange(kitchen.id)}
                  className={getButtonClass(activeSection === kitchen.id)}
                  aria-selected={activeSection === kitchen.id}
                  role="button"
                >
                  {kitchen.name}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
