import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  children?: ReactNode;
}

export function Header({
  title,
  leftContent,
  rightContent,
  children,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1 flex items-center gap-3">
            {leftContent}
            <h2 className="text-2xl/7 font-bold text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight dark:text-white">
              {title}
            </h2>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 gap-3">{rightContent}</div>
        </div>
        {children}
      </div>
    </header>
  );
}
