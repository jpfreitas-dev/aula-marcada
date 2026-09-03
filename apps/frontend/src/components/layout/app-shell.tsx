import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';
import { PageHeaderProvider } from '@/context/page-header-context';
import { AgendaRefreshProvider } from '@/context/agenda-refresh-context';
import { ClassDetailProvider } from '@/context/class-detail-context';
import { ScheduleModalProvider } from '@/context/schedule-modal-context';
import { useConnectivity } from '@/hooks/use-connectivity';

function ShellLayout() {
  const { isOnline } = useConnectivity();

  return (
    <div className="h-dvh bg-header md:bg-surface-dim/40 md:px-6 md:py-4">
      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-bg-subtle md:rounded-xl md:shadow-sm">
        {!isOnline ? <OfflineBanner /> : null}
        <AppHeader />
        <main className="scroll-area flex-1 px-margin-main py-stack-md pb-28 md:px-6 md:pb-24 lg:px-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <PageHeaderProvider>
      <AgendaRefreshProvider>
        <ScheduleModalProvider>
          <ClassDetailProvider>
            <ShellLayout />
          </ClassDetailProvider>
        </ScheduleModalProvider>
      </AgendaRefreshProvider>
    </PageHeaderProvider>
  );
}
