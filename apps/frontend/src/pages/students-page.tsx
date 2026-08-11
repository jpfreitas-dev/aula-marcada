import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { listStudents } from '@/services/student-service';
import type { Student } from '@/types';
import {
  formatRelativeNextClass,
  getStudentFinancialBadgeVariant,
  getStudentFinancialLabel,
} from '@/utils/workday';

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
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-outline"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar aluno..."
            className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-10 pr-3 text-sm text-text-main placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <Button
          type="button"
          size="md"
          className="h-10 w-10 shrink-0 rounded-lg p-0"
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
              className="block rounded-xl border border-outline-variant bg-white p-4 transition-transform active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-base font-bold text-text-main">
                  {student.name}
                </span>
                <Badge
                  label={getStudentFinancialLabel(student)}
                  variant={getStudentFinancialBadgeVariant(student)}
                  className="px-2.5 py-1"
                />
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                <Icon name="calendar_month" className="text-base" />
                <span>
                  Próxima aula: {formatRelativeNextClass(student.nextClassAt)}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
