import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStudentById } from '@/services/student-service';
import type { Student } from '@/types';
import { formatCurrency } from '@/utils/currency';
import {
  formatRelativeNextClass,
  getStudentFinancialLabel,
} from '@/utils/workday';

export function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    void getStudentById(id).then(setStudent);
  }, [id]);

  if (!student) {
    return (
      <section className="rounded-card bg-white p-card-padding shadow-sm">
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

  return (
    <div className="flex flex-col gap-stack-md">
      <Link
        to="/students"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        ← Voltar
      </Link>

      <section className="rounded-card border border-outline-variant/30 bg-white p-card-padding shadow-sm">
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

      <section className="rounded-card border border-outline-variant/30 bg-white p-card-padding shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
          Financeiro
        </h3>
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

      <section className="rounded-card border border-dashed border-outline-variant bg-bg-subtle p-card-padding">
        <p className="text-sm text-text-muted">
          Histórico de aulas, configurações e modal de pagamento serão
          implementados na fase de alunos mockados.
        </p>
      </section>
    </div>
  );
}
