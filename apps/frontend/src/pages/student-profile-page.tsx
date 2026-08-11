import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { StudentRecentClassesSection } from '@/components/classes/student-recent-classes-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClassDetail } from '@/context/class-detail-context';
import { listClassesByStudent } from '@/services/class-service';
import { getStudentByIdService } from '@/services/student-service';
import type { ClassSession, Student } from '@/types';
import { calculateStudentPendingAmount } from '@/utils/class-value';
import { formatCurrency } from '@/utils/currency';
import {
  formatRelativeNextClass,
  getStudentFinancialLabel,
} from '@/utils/workday';
import { subscribe } from '@/mocks';

export function StudentProfilePage() {
  const { id } = useParams();
  const { openClassDetail } = useClassDetail();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentClasses, setStudentClasses] = useState<ClassSession[]>([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadProfile = () => {
      void getStudentByIdService(id).then(setStudent);
      void listClassesByStudent(id).then(setStudentClasses);
    };

    loadProfile();
    return subscribe(loadProfile);
  }, [id]);

  if (!student) {
    return (
      <section className="rounded-md bg-white p-card-padding shadow-sm">
        <h2 className="font-display text-headline-md font-semibold text-purple-900">
          Perfil do aluno
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          {id ? 'Aluno não encontrado.' : 'Identificador inválido.'}
        </p>
        <Link
          to="/students"
          className="mt-4 inline-block text-sm font-medium text-primary"
        >
          Voltar para alunos
        </Link>
      </section>
    );
  }

  const pendingAmount = calculateStudentPendingAmount(studentClasses);

  return (
    <div className="flex flex-col gap-stack-md">
      <Link
        to="/students"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        ← Voltar
      </Link>

      <section className="rounded-md border border-outline-variant/30 bg-white p-card-padding shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-headline-md font-semibold text-purple-900">
              {student.name}
            </h2>
            <p className="mt-1 text-sm text-text-muted">{student.phone}</p>
            {student.email ? (
              <p className="text-sm text-text-muted">{student.email}</p>
            ) : null}
          </div>
          <Badge
            label={getStudentFinancialLabel(student.financialStatus)}
            variant={
              student.financialStatus === 'up_to_date' ? 'success' : 'warning'
            }
          />
        </div>
      </section>

      <section className="rounded-md border border-outline-variant/30 bg-white p-card-padding shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Financeiro
        </h3>
        {pendingAmount > 0 ? (
          <p className="mt-3 font-medium text-text-main">
            Pendente: {formatCurrency(pendingAmount)}
          </p>
        ) : student.advanceBalance > 0 ? (
          <p className="mt-3 font-medium text-text-main">
            Adiantado: {formatCurrency(student.advanceBalance)}
          </p>
        ) : (
          <p className="mt-3 font-medium text-text-main">Em dia</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-text-muted">Valor/hora</p>
            <p className="font-mono text-sm font-medium">
              {formatCurrency(student.hourlyRate)}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted">Saldo adiantado</p>
            <p className="font-mono text-sm font-medium">
              {formatCurrency(student.advanceBalance)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Próxima aula: {formatRelativeNextClass(student.nextClassAt)}
        </p>
        <Button type="button" className="mt-4 w-full">
          Receber pagamento
        </Button>
      </section>

      {studentClasses.length > 0 ? (
        <section className="rounded-md border border-outline-variant/30 bg-white p-card-padding shadow-sm">
          <StudentRecentClassesSection
            studentId={student.id}
            onClassClick={openClassDetail}
          />
        </section>
      ) : null}
    </div>
  );
}
