import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useKitchens } from "../hooks/useKitchens";
import { usePlanLimits } from "../hooks/usePlanLimits";
import { useStripeCheckout } from "../hooks/useStripeCheckout";
import { useDarkModeContext } from "../context/DarkModeContext";
import {
  Page,
  PageHeader,
  Logo,
  NavLinks,
  UserAvatarMenu,
  KitchenOnboardingModal,
} from "../components";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { kitchens, loading } = useKitchens(user?.id);
  const { limits } = usePlanLimits();
  const { handleCheckout } = useStripeCheckout();
  const { isDark } = useDarkModeContext();
  const [settingsMenuOpen, setSettingsMenuOpen] = useState<string | null>(null);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

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
    if (!limits) {
      return;
    }
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
      <Page
        header={
          <PageHeader
            startContent={<Logo />}
            endContent={<NavLinks end={<UserAvatarMenu />} />}
          />
        }
        body={
          <div className="flex items-center justify-center h-screen">
            <p
              className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              } text-lg`}
            >
              Loading kitchens...
            </p>
          </div>
        }
        footer={false}
      />
    );
  }

  return (
    <Page
      header={
        <PageHeader
          startContent={<Logo onClick={() => navigate("/")} />}
          endContent={<NavLinks end={<UserAvatarMenu />} />}
        />
      }
      body={
        <>
          {/* Main Content */}
          <main className="relative z-1 max-w-4xl mx-auto px-8 py-10 pb-20">
            <h1
              className={`text-3xl font-semibold tracking-tight mb-2 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Your Kitchens
            </h1>
            <p
              className={`text-sm mb-10 ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Select a kitchen to manage prep lists and team
            </p>

            {kitchens.length === 0 ? (
              <div
                className={`rounded-2xl border-2 border-dashed p-16 text-center ${
                  isDark
                    ? "border-slate-700 bg-slate-800/50"
                    : "border-stone-300 bg-stone-100/50"
                }`}
              >
                <h2
                  className={`text-2xl font-semibold mb-2 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  No kitchens yet
                </h2>
                <p
                  className={`mb-8 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Create your first kitchen to get started
                </p>
                <button
                  onClick={handleCreateKitchen}
                  disabled={loading || !limits}
                  className="px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50"
                >
                  Create Kitchen
                </button>
              </div>
            ) : (
              <>
                {/* Kitchen Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {kitchens.map((kitchen) => (
                    <div
                      key={kitchen.id}
                      className={`relative rounded-2xl border transition-all cursor-pointer group ${
                        isDark
                          ? "bg-linear-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-slate-600 hover:shadow-xl hover:shadow-slate-900/50"
                          : "bg-white border-stone-200 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/10"
                      }`}
                      onClick={() => handleSelectKitchen(kitchen)}
                    >
                      {/* Settings Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSettingsMenuOpen(
                            settingsMenuOpen === kitchen.id ? null : kitchen.id
                          );
                        }}
                        className={`absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isDark
                            ? "text-gray-500 hover:bg-slate-700 hover:text-gray-300"
                            : "text-gray-400 hover:bg-stone-100 hover:text-gray-600"
                        }`}
                        data-settings-menu
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {/* Settings Dropdown */}
                      {settingsMenuOpen === kitchen.id && (
                        <div
                          className={`absolute top-14 right-6 w-48 rounded-xl shadow-xl border z-50 ${
                            isDark
                              ? "bg-slate-800 border-slate-700"
                              : "bg-white border-stone-200"
                          }`}
                          data-settings-menu
                        >
                          {[
                            "Kitchen Settings",
                            "Manage Shifts",
                            "Team Members",
                            "Stations",
                          ].map((item) => (
                            <button
                              key={item}
                              className={`w-full px-4 py-3 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                                isDark
                                  ? "text-gray-300 hover:bg-slate-700 hover:text-white"
                                  : "text-gray-700 hover:bg-stone-100 hover:text-gray-900"
                              }`}
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-8">
                        {/* Kitchen Icon */}
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 border ${
                            isDark
                              ? "bg-orange-500/10 border-orange-500/20"
                              : "bg-orange-100/50 border-orange-200/50"
                          }`}
                        >
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-orange-500"
                          >
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            <polyline points="9,22 9,12 15,12 15,22" />
                          </svg>
                        </div>

                        <h3
                          className={`text-lg font-semibold mb-3 tracking-tight ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {kitchen.name}
                        </h3>

                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold mb-6 ${
                            isDark
                              ? "bg-orange-500/10 text-orange-400"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {kitchen.owner_id === user?.id ? "Owner" : "Member"}
                        </span>

                        <div
                          className={`flex items-center gap-2 text-base font-semibold group-hover:gap-3 transition-all ${
                            isDark ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          <span>Enter Kitchen</span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="9,18 15,12 9,6" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Kitchen Card */}
                  <div
                    onClick={() => {
                      if (canAddKitchen) {
                        handleCreateKitchen();
                      } else {
                        setUpgradeModalOpen(true);
                      }
                    }}
                    className={`relative rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center min-h-60 transition-all cursor-pointer ${
                      canAddKitchen
                        ? isDark
                          ? "border-slate-700 bg-slate-800/30 hover:border-orange-500 hover:bg-orange-500/5"
                          : "border-stone-300 bg-stone-100/30 hover:border-orange-400 hover:bg-orange-100/20"
                        : isDark
                        ? "border-slate-700 bg-slate-800/20 opacity-60"
                        : "border-stone-300 bg-stone-100/20 opacity-60"
                    }`}
                  >
                    {/* Lock icon for free users */}
                    {!canAddKitchen && (
                      <div
                        className={`absolute top-6 right-6 ${
                          isDark ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`w-16 h-16 rounded-xl flex items-center justify-center mb-6 border ${
                        canAddKitchen
                          ? isDark
                            ? "bg-slate-700 border-slate-600"
                            : "bg-stone-200 border-stone-300"
                          : isDark
                          ? "bg-slate-800 border-slate-700"
                          : "bg-stone-300 border-stone-400"
                      }`}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={
                          canAddKitchen
                            ? isDark
                              ? "text-gray-400"
                              : "text-gray-600"
                            : isDark
                            ? "text-gray-600"
                            : "text-gray-500"
                        }
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </div>

                    <span
                      className={`text-lg font-semibold mb-2 tracking-tight ${
                        canAddKitchen
                          ? isDark
                            ? "text-white"
                            : "text-gray-900"
                          : isDark
                          ? "text-gray-500"
                          : "text-gray-600"
                      }`}
                    >
                      {canAddKitchen
                        ? "Create New Kitchen"
                        : "Add Another Kitchen"}
                    </span>

                    {!canAddKitchen && (
                      <span className="text-sm font-semibold text-orange-500">
                        Pro Feature
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>

          {/* Upgrade Modal */}
          {upgradeModalOpen && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setUpgradeModalOpen(false)}
            >
              <div
                className={`rounded-2xl border shadow-2xl max-w-md w-full p-8 ${
                  isDark
                    ? "bg-linear-to-br from-slate-800 to-slate-900 border-slate-700"
                    : "bg-linear-to-br from-white to-stone-50 border-stone-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Star Icon */}
                <div className="w-14 h-14 bg-linear-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                  </svg>
                </div>

                <h2
                  className={`text-2xl font-semibold mb-3 ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  Manage Multiple Kitchens
                </h2>

                <p
                  className={`text-base leading-relaxed mb-8 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Running prep at more than one spot? Pro lets you manage
                  unlimited kitchens from one account—switch between venues
                  without logging out.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradeModalOpen(false)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all border ${
                      isDark
                        ? "border-slate-700 text-gray-300 hover:bg-slate-700 hover:text-white"
                        : "border-stone-300 text-gray-700 hover:bg-stone-100 hover:text-gray-900"
                    }`}
                  >
                    Maybe Later
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await handleCheckout();
                      } catch (error) {
                        console.error("Checkout failed:", error);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/30"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Kitchen Onboarding Modal */}
          <KitchenOnboardingModal
            isOpen={onboardingModalOpen}
            onClose={() => setOnboardingModalOpen(false)}
            onSuccess={handleKitchenCreated}
          />
        </>
      }
      footer={false}
    />
  );
}
