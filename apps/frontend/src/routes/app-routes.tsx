import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { FinancialPage } from '@/pages/financial-page';
import { HomePage } from '@/pages/home-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { StudentProfilePage } from '@/pages/student-profile-page';
import { StudentsPage } from '@/pages/students-page';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/students/:id" element={<StudentProfilePage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
