import { NavLink, useLocation } from 'react-router-dom';

import { Icon } from '@/components/ui/icon';
import { useScheduleModal } from '@/context/schedule-modal-context';

const navItems = [
  { label: 'Início', path: '/', icon: 'home' },
  { label: 'Alunos', path: '/students', icon: 'group' },
  { label: 'Financeiro', path: '/financial', icon: 'payments' },
  { label: 'Mais', path: '/more', icon: 'more_horiz' },
] as const;

function isNavItemActive(pathname: string, path: string): boolean {
  if (path === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(path);
}

export function BottomNav() {
  const location = useLocation();
  const { openScheduleModal } = useScheduleModal();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 md:pointer-events-auto md:static">
      <nav
        className="pointer-events-auto mx-auto flex max-w-6xl select-none items-end justify-around border-t border-surface-variant bg-surface px-2 pt-2 shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:items-center md:pt-0 md:pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] min-h-[calc(5rem+env(safe-area-inset-bottom,0px))] md:min-h-20"
        aria-label="Navegação principal"
      >
        {navItems.slice(0, 2).map((item) => {
          const active = isNavItemActive(location.pathname, item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex h-16 w-16 cursor-pointer flex-col items-center justify-center transition-colors ${
                active
                  ? 'font-bold text-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon
                name={item.icon}
                filled={active}
                className="text-2xl transition-transform duration-150 group-hover:scale-[1.2]"
              />
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}

        <div className="relative -top-6 md:-top-6">
          <button
            type="button"
            onClick={() => openScheduleModal()}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-4 border-bg-subtle bg-primary-container text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
            aria-label="Adicionar aula"
          >
            <Icon name="add" className="text-3xl font-bold" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const active = isNavItemActive(location.pathname, item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`group flex h-16 w-16 cursor-pointer flex-col items-center justify-center transition-colors ${
                active
                  ? 'font-bold text-primary'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              <Icon
                name={item.icon}
                filled={active}
                className="text-2xl transition-transform duration-150 group-hover:scale-[1.2]"
              />
              <span className="mt-1 text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
