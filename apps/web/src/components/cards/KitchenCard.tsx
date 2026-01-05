import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { Card } from "../ui/Card";
import { IconBox } from "../ui/IconBox";
import { KniferollIcon } from "../icons/KniferollIcon";

interface KitchenCardProps {
  name: string;
  role?: string;
  onClick: () => void;
  menuContent?: ReactNode;
  showMenu?: boolean;
  onMenuToggle?: () => void;
}

/**
 * KitchenCard - card for displaying a kitchen in the dashboard grid.
 */
export function KitchenCard({
  name,
  role = "Owner",
  onClick,
  menuContent,
  showMenu,
  onMenuToggle,
}: KitchenCardProps) {
  const { isDark } = useDarkModeContext();

  return (
    <Card variant="interactive" padding="none" className="relative w-full" onClick={onClick}>
      {/* Settings Button */}
      {onMenuToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle();
          }}
          className={`absolute top-6 right-6 w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? "text-gray-500 hover:bg-slate-700 hover:text-gray-300"
              : "text-gray-400 hover:bg-stone-100 hover:text-gray-600"
          }`}
          data-settings-menu
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="12" r="2" />
            <circle cx="12" cy="19" r="2" />
          </svg>
        </button>
      )}

      {/* Settings Dropdown */}
      {showMenu && menuContent && (
        <div
          className={`absolute top-14 right-6 w-48 rounded-xl shadow-xl border z-50 ${
            isDark ? "bg-slate-800 border-slate-700" : "bg-white border-stone-200"
          }`}
          data-settings-menu
        >
          {menuContent}
        </div>
      )}

      {/* Card Content */}
      <div className="p-8">
        <IconBox size="lg" variant="accent" className="mb-5">
          <KniferollIcon size={28} />
        </IconBox>

        <h3
          className={`text-xl font-semibold mb-2 cursor-pointer ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {name}
        </h3>

        {/* Role Badge */}
        <span
          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-md mb-4 ${
            isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"
          }`}
        >
          {role}
        </span>

        {/* Enter link */}
        <div
          className={`flex items-center gap-1 text-sm font-medium ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <span>Enter Kitchen</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </Card>
  );
}
