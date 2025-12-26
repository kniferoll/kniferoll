import type { ReactNode } from "react";

interface HeaderProps {
  title: string;
  rightContent?: ReactNode;
  children?: ReactNode;
}

export function Header({ title, rightContent, children }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            {title}
          </h1>
          {rightContent}
        </div>
        {children}
      </div>
    </header>
  );
}
