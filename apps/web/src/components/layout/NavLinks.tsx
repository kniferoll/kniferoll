import type { ReactNode } from "react";

interface NavLinksProps {
  start?: ReactNode;
  end?: ReactNode;
}

export function NavLinks({ start, end }: NavLinksProps) {
  return (
    <div className="flex items-center gap-3">
      {start}
      {end}
    </div>
  );
}
