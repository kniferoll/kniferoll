import { type ReactNode } from "react";
import { useDarkModeContext } from "@/context";

interface DangerZoneProps {
  children: ReactNode;
}

export function DangerZone({ children }: DangerZoneProps) {
  const { isDark } = useDarkModeContext();

  return (
    <div className={`pt-6 mt-6 border-t ${isDark ? "border-slate-700" : "border-stone-200"}`}>
      <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
      {children}
    </div>
  );
}
