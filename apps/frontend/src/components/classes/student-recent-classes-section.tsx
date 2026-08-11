import { useEffect, useState } from 'react';

import { StudentRecentClassCard } from '@/components/classes/student-recent-class-card';
import { listRecentClassesByStudent } from '@/services/class-service';
import type { ClassSession } from '@/types';
import { subscribe } from '@/mocks';

export function getRecentClassesTitle(count: number): string {
  return count === 1 ? 'Aula mais recente' : 'Aulas mais recentes';
}

type StudentRecentClassesSectionProps = {
  studentId: string;
  limit?: number;
  onClassClick?: (classId: string) => void;
};

export function StudentRecentClassesSection({
  studentId,
  limit = 2,
  onClassClick,
}: StudentRecentClassesSectionProps) {
  const [recentClasses, setRecentClasses] = useState<ClassSession[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadRecentClasses = () => {
      void listRecentClassesByStudent(studentId, limit).then((sessions) => {
        if (!cancelled) {
          setRecentClasses(sessions);
        }
      });
    };

    loadRecentClasses();
    const unsubscribe = subscribe(loadRecentClasses);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [studentId, limit]);

  if (recentClasses.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {getRecentClassesTitle(recentClasses.length)}
      </h3>
      <div className="flex flex-col gap-3">
        {recentClasses.map((session) => (
          <StudentRecentClassCard
            key={session.id}
            session={session}
            onClick={onClassClick ? () => onClassClick(session.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
