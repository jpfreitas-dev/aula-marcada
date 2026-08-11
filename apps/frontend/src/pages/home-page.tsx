import { useEffect, useMemo, useState } from 'react';

import { ClassCard } from '@/components/classes/class-card';
import { EmptySlot } from '@/components/ui/empty-slot';
import { Icon } from '@/components/ui/icon';
import { iconButtonClassName } from '@/components/ui/icon-button';
import { useClassDetail } from '@/context/class-detail-context';
import { useScheduleModal } from '@/context/schedule-modal-context';
import { useMockStore } from '@/hooks/use-mock-store';
import { usePageHeader } from '@/hooks/use-page-header';
import {
  getSessionForPeriod,
  listClassesByDate,
  listClassesByWeek,
} from '@/services/class-service';
import type { ClassPeriod, ClassSession } from '@/types';
import {
  addWorkdays,
  formatShortDate,
  formatWeekRange,
  formatWorkdayLabel,
  getDefaultAgendaDate,
  getWeekdayLabel,
  getWeekStart,
  getWorkdaysOfWeek,
  toDateKey,
} from '@/utils/workday';

type AgendaView = 'day' | 'week';

const periodLabels: Record<ClassPeriod, string> = {
  morning: 'MANHÃ',
  afternoon: 'TARDE/NOITE',
};

function DayWeekToggle({
  view,
  onChange,
}: {
  view: AgendaView;
  onChange: (view: AgendaView) => void;
}) {
  return (
    <div className="mx-auto flex w-48 rounded-full bg-black/20 p-1">
      <button
        type="button"
        onClick={() => onChange('day')}
        className={`flex-1 rounded-full py-1 text-xs font-bold transition-all ${
          view === 'day'
            ? 'bg-white text-purple-900'
            : 'font-medium text-white/70'
        }`}
      >
        Dia
      </button>
      <button
        type="button"
        onClick={() => onChange('week')}
        className={`flex-1 rounded-full py-1 text-xs font-bold transition-all ${
          view === 'week'
            ? 'bg-white text-purple-900'
            : 'font-medium text-white/70'
        }`}
      >
        Semana
      </button>
    </div>
  );
}

function PeriodSection({
  label,
  session,
  date,
  period,
  onAdd,
  onOpenClass,
}: {
  label: string;
  session?: ClassSession;
  date: string;
  period: ClassPeriod;
  onAdd: (slot: { date: string; period: ClassPeriod }) => void;
  onOpenClass: (classId: string) => void;
}) {
  return (
    <section className="mt-4 flex flex-col gap-stack-sm">
      <h3 className="px-2 text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </h3>
      {session ? (
        <ClassCard session={session} onClick={() => onOpenClass(session.id)} />
      ) : (
        <EmptySlot onClick={() => onAdd({ date, period })} />
      )}
    </section>
  );
}

export function HomePage() {
  useMockStore();
  const [view, setView] = useState<AgendaView>('day');
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultAgendaDate(),
  );
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const { openScheduleModal } = useScheduleModal();
  const { openClassDetail } = useClassDetail();

  const headerToggle = useMemo(
    () => <DayWeekToggle view={view} onChange={setView} />,
    [view],
  );
  usePageHeader(headerToggle);

  useEffect(() => {
    async function loadSessions() {
      if (view === 'day') {
        setSessions(await listClassesByDate(selectedDate));
        return;
      }

      setSessions(await listClassesByWeek(getWeekStart(selectedDate)));
    }

    void loadSessions();
  }, [selectedDate, view]);

  const navigateDate = (direction: -1 | 1) => {
    if (view === 'day') {
      setSelectedDate((current) => addWorkdays(current, direction));
      return;
    }

    setSelectedDate((current) => addWorkdays(current, direction * 5));
  };

  const weekDays = getWorkdaysOfWeek(getWeekStart(selectedDate));
  const weekStart = getWeekStart(selectedDate);
  const todayKey = toDateKey(new Date());

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="mt-2 flex items-center justify-between rounded-md border border-outline-variant/30 bg-surface p-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigateDate(-1)}
          className={`${iconButtonClassName} h-8 w-8 text-primary`}
          aria-label="Período anterior"
        >
          <Icon name="chevron_left" />
        </button>
        <span className="text-center text-sm font-bold text-text-main">
          {view === 'day'
            ? formatWorkdayLabel(selectedDate)
            : formatWeekRange(weekStart)}
        </span>
        <button
          type="button"
          onClick={() => navigateDate(1)}
          className={`${iconButtonClassName} h-8 w-8 text-primary`}
          aria-label="Próximo período"
        >
          <Icon name="chevron_right" />
        </button>
      </div>

      {view === 'day' ? (
        <>
          <PeriodSection
            label={periodLabels.morning}
            session={getSessionForPeriod(sessions, 'morning')}
            date={toDateKey(selectedDate)}
            period="morning"
            onAdd={openScheduleModal}
            onOpenClass={openClassDetail}
          />
          <PeriodSection
            label={periodLabels.afternoon}
            session={getSessionForPeriod(sessions, 'afternoon')}
            date={toDateKey(selectedDate)}
            period="afternoon"
            onAdd={openScheduleModal}
            onOpenClass={openClassDetail}
          />
        </>
      ) : (
        weekDays.map((day) => {
          const dayKey = toDateKey(day);
          const daySessions = sessions.filter(
            (session) => session.date === dayKey,
          );
          const isToday = dayKey === todayKey;

          return (
            <section
              key={dayKey}
              className="rounded-lg border border-outline-variant/20 bg-white p-3 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-purple-900">
                  {getWeekdayLabel(day)}, {formatShortDate(day)}
                </h3>
                {isToday ? (
                  <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-xs font-semibold text-primary">
                    Hoje
                  </span>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <PeriodSection
                  label={periodLabels.morning}
                  session={getSessionForPeriod(daySessions, 'morning')}
                  date={dayKey}
                  period="morning"
                  onAdd={openScheduleModal}
                  onOpenClass={openClassDetail}
                />
                <PeriodSection
                  label={periodLabels.afternoon}
                  session={getSessionForPeriod(daySessions, 'afternoon')}
                  date={dayKey}
                  period="afternoon"
                  onAdd={openScheduleModal}
                  onOpenClass={openClassDetail}
                />
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
