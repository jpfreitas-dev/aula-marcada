import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { CreateStudentModal } from '@/components/students/create-student-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { useMockStore } from '@/hooks/use-mock-store';
import { listClasses } from '@/services/class-service';
import {
  listStudents,
  type StudentListFilter,
} from '@/services/student-service';
import type { Student } from '@/types';
import {
  calculateStudentPendingSummary,
  type StudentPendingSummary,
} from '@/utils/class-value';
import { getStudentFinancialBadge } from '@/utils/student-financial';
import { formatRelativeNextClass } from '@/utils/workday';

const EMPTY_PENDING: StudentPendingSummary = { amount: 0, lessonCount: 0 };

function resolveListFilter(view: string | null): StudentListFilter {
  return view === 'former' ? 'inactive' : 'active';
}

export function StudentsPage() {
  const storeVersion = useMockStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const listFilter = resolveListFilter(searchParams.get('view'));
  const showingFormer = listFilter === 'inactive';

  const [students, setStudents] = useState<Student[]>([]);
  const [pendingByStudentId, setPendingByStudentId] = useState<
    Record<string, StudentPendingSummary>
  >({});
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    void Promise.all([listStudents(listFilter), listClasses()]).then(
      ([loadedStudents, classes]) => {
        setStudents(loadedStudents);

        const pendingMap = loadedStudents.reduce<
          Record<string, StudentPendingSummary>
        >((accumulator, student) => {
          const studentClasses = classes.filter(
            (session) => session.studentId === student.id,
          );
          accumulator[student.id] =
            calculateStudentPendingSummary(studentClasses);
          return accumulator;
        }, {});

        setPendingByStudentId(pendingMap);
      },
    );
  }, [listFilter, storeVersion]);

  const filteredStudents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return students;
    }

    return students.filter((student) =>
      student.name.toLowerCase().includes(normalizedQuery),
    );
  }, [query, students]);

  const openActiveList = () => {
    setQuery('');
    setSearchParams({});
  };

  const openFormerList = () => {
    setQuery('');
    setSearchParams({ view: 'former' });
  };

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
            placeholder={
              showingFormer ? 'Buscar ex-aluno...' : 'Buscar aluno...'
            }
            className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-10 pr-3 text-sm text-text-main placeholder:text-text-muted focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {!showingFormer ? (
          <Button
            type="button"
            size="md"
            className="h-10 w-10 shrink-0 rounded-lg p-0"
            aria-label="Novo aluno"
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="person_add" className="text-xl" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-main">
          {showingFormer ? 'Ex-alunos' : 'Alunos'}
        </h2>
        {showingFormer ? (
          <button
            type="button"
            onClick={openActiveList}
            className="text-sm font-medium text-primary"
          >
            Ver alunos ativos
          </button>
        ) : (
          <button
            type="button"
            onClick={openFormerList}
            className="text-sm font-medium text-primary"
          >
            Ver ex-alunos
          </button>
        )}
      </div>

      {filteredStudents.length === 0 ? (
        <p className="text-sm text-text-muted">
          {showingFormer
            ? 'Nenhum ex-aluno encontrado.'
            : 'Nenhum aluno encontrado.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredStudents.map((student) => {
            const pending = pendingByStudentId[student.id] ?? EMPTY_PENDING;
            const financialBadge = getStudentFinancialBadge(student, pending);

            return (
              <li key={student.id}>
                <Link
                  to={`/students/${student.id}`}
                  className="block rounded-xl border border-outline-variant bg-white p-4 transition-transform active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-display text-base font-bold text-text-main">
                      {student.name}
                    </span>
                    {showingFormer ? (
                      <Badge
                        label="Ex-aluno"
                        variant="neutral"
                        className="px-2.5 py-1"
                      />
                    ) : (
                      <Badge
                        label={financialBadge.label}
                        variant={financialBadge.variant}
                        className="px-2.5 py-1"
                      />
                    )}
                  </div>
                  {!showingFormer ? (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                      <Icon name="calendar_month" className="text-base" />
                      <span>
                        Próxima aula:{' '}
                        {formatRelativeNextClass(student.nextClassAt)}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-text-muted">
                      Consulta e histórico financeiro
                    </p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <CreateStudentModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
