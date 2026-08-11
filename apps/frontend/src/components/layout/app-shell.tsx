import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import {
  PageHeaderProvider,
  usePageHeaderContext,
} from '@/context/page-header-context';
import { ScheduleModalProvider } from '@/context/schedule-modal-context';

function ShellLayout() {
  const { headerChildren } = usePageHeaderContext();

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg-subtle">
      <AppHeader>{headerChildren}</AppHeader>
      <main className="flex-1 px-margin-main py-stack-md pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

export function AppShell() {
  return (
    <PageHeaderProvider>
      <ScheduleModalProvider>
        <ShellLayout />
      </ScheduleModalProvider>
    </PageHeaderProvider>
  );
}
