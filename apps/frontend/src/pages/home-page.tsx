import { useEffect, useRef, useState } from 'react';

import { ClassCard } from '@/components/classes/class-card';
import { EmptySlot } from '@/components/ui/empty-slot';
import { Icon } from '@/components/ui/icon';
import { PeriodNavigator } from '@/components/ui/period-navigator';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { useAgendaRefresh } from '@/context/agenda-refresh-context';
import { useClassDetail } from '@/context/class-detail-context';
import { useScheduleModal } from '@/context/schedule-modal-context';
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

const agendaViewOptions: { value: AgendaView; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
];

const periodLabels: Record<ClassPeriod, string> = {
  morning: 'MANHÃ',
  afternoon: 'TARDE/NOITE',
};

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
    <section className="flex min-w-0 flex-col gap-stack-sm">
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
  const { version: agendaVersion } = useAgendaRefresh();
  const [view, setView] = useState<AgendaView>('day');
  const [selectedDate, setSelectedDate] = useState(() =>
    getDefaultAgendaDate(),
  );
  const [displaySessions, setDisplaySessions] = useState<ClassSession[]>([]);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const { openScheduleModal } = useScheduleModal();
  const { openClassDetail } = useClassDetail();

  const requestKey = `${view}:${toDateKey(selectedDate)}:${agendaVersion}`;
  const isLoading = loadedRequestKey !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    async function loadSessions() {
      try {
        const nextSessions =
          view === 'day'
            ? await listClassesByDate(selectedDate, controller.signal)
            : await listClassesByWeek(
                getWeekStart(selectedDate),
                controller.signal,
              );

        if (requestIdRef.current !== requestId) {
          return;
        }

        setDisplaySessions(nextSessions);
        setLoadedRequestKey(requestKey);
      } catch (error) {
        if (
          error instanceof Error &&
          (error.name === 'CanceledError' || error.name === 'AbortError')
        ) {
          return;
        }
      }
    }

    void loadSessions();

    return () => {
      controller.abort();
    };
  }, [requestKey, selectedDate, view]);

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
  const isStale = isLoading && displaySessions.length > 0;

  return (
    <div className="flex flex-col gap-stack-md">
      <SegmentedToggle
        value={view}
        onChange={setView}
        options={agendaViewOptions}
      />

      <PeriodNavigator
        label={
          view === 'day'
            ? formatWorkdayLabel(selectedDate)
            : formatWeekRange(weekStart)
        }
        onPrevious={() => navigateDate(-1)}
        onNext={() => navigateDate(1)}
      />

      {isLoading && displaySessions.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          <Icon name="progress_activity" className="animate-spin text-3xl" />
        </div>
      ) : (
        <div
          className={`transition-opacity ${isStale ? 'opacity-60' : 'opacity-100'}`}
        >
          {view === 'day' ? (
            <div className="grid grid-cols-1 gap-stack-md md:grid-cols-2">
              <PeriodSection
                label={periodLabels.morning}
                session={getSessionForPeriod(displaySessions, 'morning')}
                date={toDateKey(selectedDate)}
                period="morning"
                onAdd={openScheduleModal}
                onOpenClass={openClassDetail}
              />
              <PeriodSection
                label={periodLabels.afternoon}
                session={getSessionForPeriod(displaySessions, 'afternoon')}
                date={toDateKey(selectedDate)}
                period="afternoon"
                onAdd={openScheduleModal}
                onOpenClass={openClassDetail}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {weekDays.map((day) => {
                const dayKey = toDateKey(day);
                const daySessions = displaySessions.filter(
                  (session) => session.date === dayKey,
                );
                const isToday = dayKey === todayKey;

                return (
                  <section
                    key={dayKey}
                    className="min-w-0 rounded-lg border border-outline-variant/20 bg-surface p-3 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
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
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
