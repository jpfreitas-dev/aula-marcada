import { Outlet } from 'react-router-dom';

import { AppHeader } from '@/components/layout/app-header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ClassDetailProvider } from '@/context/class-detail-context';
import {
  PageHeaderProvider,
  usePageHeaderContext,
} from '@/context/page-header-context';
import { ScheduleModalProvider } from '@/context/schedule-modal-context';

function ShellLayout() {
  const { headerChildren } = usePageHeaderContext();

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col overflow-hidden bg-bg-subtle">
      <AppHeader>{headerChildren}</AppHeader>
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
      <ScheduleModalProvider>
        <ClassDetailProvider>
          <ShellLayout />
        </ClassDetailProvider>
      </ScheduleModalProvider>
    </PageHeaderProvider>
  );
}
