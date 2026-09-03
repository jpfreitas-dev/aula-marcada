import { useMemo, useState } from 'react';

import type { ClassSession } from '@/types';
import {
  type AttendancePeriod,
  calculateAttendanceStats,
  getAttendanceProgressPercent,
} from '@/utils/student-profile';

const PERIOD_TABS: Array<{ value: AttendancePeriod; label: string }> = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mês' },
  { value: 'year', label: 'Este ano' },
  { value: 'all', label: 'Geral' },
];

type StudentAttendanceCardProps = {
  sessions: ClassSession[];
};

export function StudentAttendanceCard({
  sessions,
}: StudentAttendanceCardProps) {
  const [period, setPeriod] = useState<AttendancePeriod>('month');

  const stats = useMemo(
    () => calculateAttendanceStats(sessions, period),
    [period, sessions],
  );

  const progressPercent = getAttendanceProgressPercent(
    stats.present,
    stats.total,
  );

  return (
    <section className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
        Frequência
      </h3>

      <div className="mt-3 flex border-b border-outline-variant/30">
        {PERIOD_TABS.map((tab) => {
          const isActive = tab.value === period;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setPeriod(tab.value)}
              className={`flex-1 border-b-2 px-1 py-2 text-center text-xs transition-colors ${
                isActive
                  ? 'border-primary font-bold text-primary'
                  : 'border-transparent font-medium text-text-muted'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-text-main">
        Presente em {stats.present} de {stats.total} aulas
      </p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary-fixed/30">
        <div
          className="h-full rounded-full bg-status-success transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </section>
  );
}
