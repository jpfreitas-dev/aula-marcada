import type { ReactNode } from 'react';

type AppHeaderProps = {
  title?: string;
  children?: ReactNode;
};

export function AppHeader({
  title = 'AULAS DE REFORÇO',
  children,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex flex-col gap-2 bg-purple-900 px-margin-main pb-2 pt-4 text-white shadow-sm">
      <h1 className="text-center font-display text-headline-md font-bold uppercase tracking-tight">
        {title}
      </h1>
      {children}
    </header>
  );
}
