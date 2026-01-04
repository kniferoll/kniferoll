import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { MenuIcon, XIcon } from "@/components/icons";
import { useDarkModeContext } from "@/context";
import type { Database } from "@kniferoll/types";

type Kitchen = Database["public"]["Tables"]["kitchens"]["Row"];

interface NavigationItem {
  name: string;
  value: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  current: boolean;
}

interface SettingsSidebarProps {
  navigation: NavigationItem[];
  onNavigate: (value: string) => void;
  title: string;
  kitchens?: Kitchen[];
  selectedKitchenId?: string;
  onKitchenSelect?: (kitchenId: string) => void;
  userSection?: React.ReactNode;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface SidebarContentProps {
  navigation: NavigationItem[];
  onNavigate: (value: string) => void;
  kitchens?: Kitchen[];
  selectedKitchenId?: string;
  onKitchenSelect?: (kitchenId: string) => void;
  userSection?: React.ReactNode;
  onCloseSidebar: () => void;
  isDark: boolean;
}

function SidebarContent({
  navigation,
  onNavigate,
  kitchens,
  selectedKitchenId,
  onKitchenSelect,
  userSection,
  onCloseSidebar,
  isDark,
}: SidebarContentProps) {
  return (
    <div
      className={classNames(
        "flex h-full flex-col overflow-y-auto border-r",
        isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200"
      )}
    >
      <nav className="flex flex-1 flex-col px-4 py-8">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          <li>
            <ul role="list" className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => {
                      onNavigate(item.value);
                      onCloseSidebar();
                    }}
                    className={classNames(
                      item.current
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                        ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                      "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors"
                    )}
                  >
                    <item.icon
                      size={20}
                      className={classNames(
                        item.current
                          ? "text-white"
                          : isDark
                          ? "text-slate-400 group-hover:text-white"
                          : "text-gray-500 group-hover:text-gray-700",
                        "shrink-0"
                      )}
                    />
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </li>

          {/* Kitchens Section */}
          {kitchens && kitchens.length > 0 && (
            <li className="mt-6">
              <div
                className={classNames(
                  "text-xs font-semibold uppercase tracking-wider px-3 mb-2",
                  isDark ? "text-slate-500" : "text-gray-500"
                )}
              >
                Kitchens
              </div>
              <ul role="list" className="space-y-1">
                {kitchens.map((kitchen) => (
                  <li key={kitchen.id}>
                    <button
                      onClick={() => {
                        onKitchenSelect?.(kitchen.id);
                        onCloseSidebar();
                      }}
                      className={classNames(
                        selectedKitchenId === kitchen.id
                          ? isDark
                            ? "bg-blue-600 text-white"
                            : "bg-blue-600 text-white"
                          : isDark
                          ? "text-slate-300 hover:bg-slate-800 hover:text-white"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium w-full transition-colors"
                      )}
                    >
                      <div
                        className={classNames(
                          selectedKitchenId === kitchen.id
                            ? "bg-white/20"
                            : isDark
                            ? "bg-slate-700/50"
                            : "bg-gray-200",
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded text-[0.625rem] font-medium"
                        )}
                      >
                        {kitchen.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{kitchen.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          )}
          {userSection && (
            <li
              className="mt-auto border-t pt-4"
              style={{
                borderColor: isDark ? "rgb(30 41 59)" : "rgb(229 231 235)",
              }}
            >
              {userSection}
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Reusable settings sidebar with mobile support
 * Follows Tailwind UI sidebar pattern
 */
export function SettingsSidebar({
  navigation,
  onNavigate,
  title,
  kitchens,
  selectedKitchenId,
  onKitchenSelect,
  userSection,
}: SettingsSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useDarkModeContext();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {/* Mobile sidebar */}
      <Dialog
        open={sidebarOpen}
        onClose={setSidebarOpen}
        className="relative z-50 xl:hidden"
      >
        <DialogBackdrop
          transition
          className={classNames(
            "fixed inset-0 transition-opacity duration-300 ease-linear data-[closed]:opacity-0",
            isDark ? "bg-gray-900/80" : "bg-gray-500/75"
          )}
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-[closed]:opacity-0">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="-m-2.5 p-2.5"
                >
                  <span className="sr-only">Close sidebar</span>
                  <XIcon
                    size={24}
                    className={isDark ? "text-white" : "text-gray-900"}
                  />
                </button>
              </div>
            </TransitionChild>
            <SidebarContent
              navigation={navigation}
              onNavigate={onNavigate}
              kitchens={kitchens}
              selectedKitchenId={selectedKitchenId}
              onKitchenSelect={onKitchenSelect}
              userSection={userSection}
              onCloseSidebar={closeSidebar}
              isDark={isDark}
            />
          </DialogPanel>
        </div>
      </Dialog>

      {/* Desktop sidebar */}
      <div className="hidden xl:fixed xl:left-0 xl:top-[73px] xl:bottom-0 xl:z-40 xl:flex xl:w-72 xl:flex-col">
        <SidebarContent
          navigation={navigation}
          onNavigate={onNavigate}
          kitchens={kitchens}
          selectedKitchenId={selectedKitchenId}
          onKitchenSelect={onKitchenSelect}
          userSection={userSection}
          onCloseSidebar={closeSidebar}
          isDark={isDark}
        />
      </div>

      {/* Mobile menu button */}
      <div
        className={classNames(
          "flex h-14 shrink-0 items-center gap-x-4 border-b px-4 sm:px-6 lg:px-8 xl:hidden",
          isDark
            ? "bg-slate-900/95 border-slate-800 backdrop-blur-sm"
            : "bg-white/95 border-gray-200 backdrop-blur-sm"
        )}
      >
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={classNames(
            "-m-2.5 p-2.5 rounded-lg xl:hidden transition-colors",
            isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
          )}
        >
          <span className="sr-only">Open sidebar</span>
          <MenuIcon
            size={22}
            className={isDark ? "text-slate-300" : "text-gray-700"}
          />
        </button>
        <div
          className={classNames(
            "flex-1 text-base font-semibold tracking-tight",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          {title}
        </div>
      </div>
    </>
  );
}
