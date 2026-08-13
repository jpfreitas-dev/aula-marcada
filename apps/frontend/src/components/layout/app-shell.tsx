import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PageHeaderProvider } from '@/context/page-header-context';
import { AgendaRefreshProvider } from '@/context/agenda-refresh-context';
import { ClassDetailProvider } from '@/context/class-detail-context';
import { ScheduleModalProvider } from '@/context/schedule-modal-context';

function ShellLayout() {
  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-bg-subtle">
      <AppHeader />
      <main className="scroll-area flex-1 px-margin-main py-stack-md pb-24">
        <Outlet />
      </main>
      <BottomNav />
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
