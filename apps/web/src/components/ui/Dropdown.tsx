import { useState, useRef, useEffect, type ReactNode } from "react";
import { useDarkModeContext } from "@/context";
import { ChevronDownIcon } from "@/components/icons";

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  isActive?: boolean;
  className?: string;
}

interface DropdownDividerProps {
  className?: string;
}

/**
 * Dropdown - reusable dropdown menu base component.
 *
 * Usage:
 * <Dropdown
 *   trigger={<Button>Open Menu</Button>}
 *   align="right"
 * >
 *   <DropdownItem onClick={handleAction} icon={<SomeIcon />}>
 *     Action Label
 *   </DropdownItem>
 *   <DropdownDivider />
 *   <DropdownItem onClick={handleOther}>Other Action</DropdownItem>
 * </Dropdown>
 */
export function Dropdown({ trigger, children, align = "right", className = "" }: DropdownProps) {
  const { isDark } = useDarkModeContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown when pressing Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`
            absolute top-full mt-1 z-50
            min-w-40 rounded-lg overflow-hidden
            border shadow-lg
            animate-slideDown
            ${align === "right" ? "right-0" : "left-0"}
            ${isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200"}
          `}
        >
          <DropdownContext.Provider
            value={{ close: () => setIsOpen(false), isDark: isDark ?? false }}
          >
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

// Context for dropdown items to close the dropdown
import { createContext, useContext } from "react";

interface DropdownContextValue {
  close: () => void;
  isDark: boolean;
}

const DropdownContext = createContext<DropdownContextValue>({
  close: () => {},
  isDark: false,
});

/**
 * DropdownItem - a single item in a dropdown menu.
 */
export function DropdownItem({
  children,
  onClick,
  icon,
  isActive = false,
  className = "",
}: DropdownItemProps) {
  const { close, isDark } = useContext(DropdownContext);

  const handleClick = () => {
    onClick?.();
    close();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5
        text-sm text-left transition-colors cursor-pointer
        ${isDark ? "text-slate-200 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"}
        ${className}
      `}
    >
      {icon && (
        <span
          className={
            isActive
              ? isDark
                ? "text-blue-400"
                : "text-blue-600"
              : isDark
                ? "text-slate-400"
                : "text-gray-500"
          }
        >
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
      {isActive && (
        <svg
          className={`w-4 h-4 ${isDark ? "text-blue-400" : "text-blue-600"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

/**
 * DropdownDivider - a horizontal divider between dropdown items.
 */
export function DropdownDivider({ className = "" }: DropdownDividerProps) {
  const { isDark } = useContext(DropdownContext);

  return (
    <div
      className={`
        h-px my-1
        ${isDark ? "bg-slate-700" : "bg-gray-100"}
        ${className}
      `}
    />
  );
}

interface DropdownTriggerButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  showChevron?: boolean;
  className?: string;
}

/**
 * DropdownTriggerButton - a styled button for dropdown triggers.
 */
export function DropdownTriggerButton({
  children,
  icon,
  showChevron = true,
  className = "",
}: DropdownTriggerButtonProps) {
  const { isDark } = useDarkModeContext();

  return (
    <button
      className={`
        inline-flex items-center gap-2 px-3 py-2
        rounded-lg text-sm font-medium
        transition-all
        ${
          isDark
            ? "bg-white/10 border border-white/20 text-white hover:bg-white/20"
            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm"
        }
        ${className}
      `}
    >
      {icon}
      {children}
      {showChevron && <ChevronDownIcon size={12} />}
    </button>
  );
}
