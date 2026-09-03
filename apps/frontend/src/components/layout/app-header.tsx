import { Link } from 'react-router-dom';

import { Icon } from '@/components/ui/icon';
import { iconButtonClassName } from '@/components/ui/icon-button';
import { usePageHeaderContext } from '@/context/page-header-context';

export function AppHeader() {
  const { headerChildren, variant, profileTitle, profileBackTo } =
    usePageHeaderContext();

  if (variant === 'profile') {
    return (
      <header className="sticky top-0 z-40 flex items-center gap-1 bg-header px-margin-main pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] text-white shadow-sm">
        <Link
          to={profileBackTo}
          className={`${iconButtonClassName} h-10 w-10 shrink-0 text-white`}
          aria-label="Voltar para lista de alunos"
        >
          <Icon name="arrow_back" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate font-display text-headline-md font-bold">
          {profileTitle}
        </h1>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex flex-col gap-2 bg-header px-margin-main pb-2 pt-[max(1rem,env(safe-area-inset-top,0px))] text-white shadow-sm">
      <h1 className="text-center font-display text-headline-md font-bold tracking-tight">
        Aula Marcada
      </h1>
      {headerChildren}
    </header>
  );
}
