import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { listStudents } from '@/services/student-service';
import type { Student } from '@/types';
import {
  formatRelativeNextClass,
  getStudentFinancialLabel,
} from '@/utils/workday';

function financialBadgeVariant(
  status: Student['financialStatus'],
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  switch (status) {
    case 'up_to_date':
      return 'success';
    case 'advance':
      return 'info';
    case 'partial':
      return 'warning';
    case 'pending':
      return 'danger';
  }
}

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    void listStudents().then(setStudents);
  }, []);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) =>
      student.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, students]);

  return (
    <div className="mt-2 flex flex-col gap-stack-md">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-outline"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar aluno..."
            className="w-full rounded-md border border-outline-variant bg-surface py-1.5 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button
          type="button"
          className="h-10 w-10 shrink-0 rounded-md p-0"
          aria-label="Novo aluno"
        >
          <Icon name="person_add" className="text-xl" />
        </Button>
      </div>

      <ul className="flex flex-col gap-3">
        {filteredStudents.map((student) => (
          <li key={student.id}>
            <Link
              to={`/students/${student.id}`}
              className="flex items-center justify-between rounded-lg border border-outline-variant/30 bg-white p-card-padding shadow-sm transition-transform active:scale-[0.99]"
            >
              <div className="flex flex-col gap-1">
                <span className="font-display text-body-md font-semibold text-text-main">
                  {student.name}
                </span>
                <span className="text-xs text-text-muted">
                  Próxima aula: {formatRelativeNextClass(student.nextClassAt)}
                </span>
              </div>
              <Badge
                label={getStudentFinancialLabel(student.financialStatus)}
                variant={financialBadgeVariant(student.financialStatus)}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
