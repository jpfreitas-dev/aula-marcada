import { Link } from 'react-router-dom';

import { Icon } from '@/components/ui/icon';
import { iconButtonClassName } from '@/components/ui/icon-button';
import { usePageHeaderContext } from '@/context/page-header-context';

export function AppHeader() {
  const { headerChildren, variant, profileTitle, profileBackTo } =
    usePageHeaderContext();

  if (variant === 'profile') {
    return (
      <header className="sticky top-0 z-40 flex items-center bg-purple-900 px-margin-main py-3 text-white shadow-sm">
        <Link
          to={profileBackTo}
          className={`${iconButtonClassName} h-10 w-10 text-white`}
          aria-label="Voltar"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="flex-1 text-center font-display text-headline-md font-bold pr-10">
          {profileTitle}
        </h1>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-2 bg-purple-900 px-margin-main pb-2 pt-4 text-white shadow-sm">
      <h1 className="text-center font-display text-headline-md font-bold uppercase tracking-tight">
        AULAS DE REFORÇO
      </h1>
      {headerChildren}
    </header>
  );
}
