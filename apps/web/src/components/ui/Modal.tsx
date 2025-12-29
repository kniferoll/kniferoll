import { type ReactNode, useEffect } from "react";
import { useDarkModeContext } from "@/context";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Modal - base modal with overlay, centering, and close behavior.
 *
 * Features:
 * - Click outside to close
 * - Escape key to close
 * - Prevents body scroll when open
 */
export function Modal({ isOpen, onClose, children, size = "md" }: ModalProps) {
  const { isDark } = useDarkModeContext();

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`
          w-full ${sizeStyles[size]} rounded-2xl border shadow-2xl p-8
          ${
            isDark
              ? "bg-linear-to-br from-slate-800 to-slate-900 border-slate-700"
              : "bg-linear-to-br from-white to-stone-50 border-stone-200"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
