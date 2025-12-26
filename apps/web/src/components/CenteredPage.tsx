import type { ReactNode } from "react";

interface CenteredPageProps {
  children: ReactNode;
  className?: string;
}

export function CenteredPage({ children, className = "" }: CenteredPageProps) {
  return (
    <div
      className={`min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 ${className}`}
    >
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
