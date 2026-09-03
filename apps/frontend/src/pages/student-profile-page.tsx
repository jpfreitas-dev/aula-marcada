import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { DeactivateStudentModal } from '@/components/students/deactivate-student-modal';
import { DeleteStudentModal } from '@/components/students/delete-student-modal';
import { EditStudentPersonalModal } from '@/components/students/edit-student-personal-modal';
import { EditStudentSettingsModal } from '@/components/students/edit-student-settings-modal';
import { ReactivateStudentModal } from '@/components/students/reactivate-student-modal';
import { ReceivePaymentModal } from '@/components/students/receive-payment-modal';
import { StudentAttendanceCard } from '@/components/students/student-attendance-card';
import { StudentFinancialCard } from '@/components/students/student-financial-card';
import { StudentSettingsCard } from '@/components/students/student-settings-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { StudentProfileSkeleton } from '@/components/ui/skeleton';
import { useProfilePageHeader } from '@/hooks/use-profile-page-header';
import { listClassesByStudent } from '@/services/class-service';
import {
  getStudentByIdService,
  listRecurrencesByStudent,
} from '@/services/student-service';
import type { ClassSession, Student, StudentRecurrence } from '@/types';
import { getApiErrorMessage } from '@/utils/api-error';
import { calculateStudentPendingSummary } from '@/utils/class-value';
import { getStudentFinancialCardContent } from '@/utils/student-financial';

export function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentClasses, setStudentClasses] = useState<ClassSession[]>([]);
  const [recurrences, setRecurrences] = useState<StudentRecurrence[]>([]);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [receivePaymentOpen, setReceivePaymentOpen] = useState(false);

  const backTo =
    student && !student.active ? '/students?view=former' : '/students';
  useProfilePageHeader('Perfil do Aluno', backTo);

  const loadProfile = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!id) {
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      setError(null);

      try {
        const [studentResult, classesResult, recurrencesResult] =
          await Promise.allSettled([
            getStudentByIdService(id),
            listClassesByStudent(id),
            listRecurrencesByStudent(id),
          ]);

        const loadedStudent =
          studentResult.status === 'fulfilled' ? studentResult.value : null;

        if (studentResult.status === 'rejected') {
          throw studentResult.reason;
        }

        if (!loadedStudent) {
          setStudent(null);
          setStudentClasses([]);
          setRecurrences([]);
          setError('Aluno não encontrado.');
          return;
        }

        setStudent(loadedStudent);

        if (classesResult.status === 'fulfilled') {
          setStudentClasses(classesResult.value);
        } else {
          setStudentClasses([]);
          if (!options?.silent) {
            setError(
              getApiErrorMessage(
                classesResult.reason,
                'Não foi possível carregar as aulas do aluno.',
              ),
            );
          }
        }

        if (recurrencesResult.status === 'fulfilled') {
          setRecurrences(recurrencesResult.value);
        } else {
          setRecurrences([]);
          if (!options?.silent && classesResult.status === 'fulfilled') {
            setError(
              getApiErrorMessage(
                recurrencesResult.reason,
                'Não foi possível carregar as recorrências.',
              ),
            );
          }
        }
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            'Não foi possível carregar o perfil do aluno.',
          ),
        );
        if (!options?.silent) {
          setStudent(null);
          setStudentClasses([]);
          setRecurrences([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- profile loader manages local state
    void loadProfile();
  }, [loadProfile]);

  if (!id) {
    return <p className="text-sm text-text-muted">Identificador inválido.</p>;
  }

  if (loading) {
    return <StudentProfileSkeleton />;
  }

  if (error && !student) {
    return <p className="text-sm text-status-danger">{error}</p>;
  }

  if (!student) {
    return <p className="text-sm text-text-muted">Aluno não encontrado.</p>;
  }

  const pending = calculateStudentPendingSummary(studentClasses);
  const financialContent = getStudentFinancialCardContent(student, pending);

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <p className="rounded-md bg-status-warning-container px-3 py-2 text-sm text-status-warning">
          {error}
        </p>
      ) : null}
      <section className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-text-main">
              {student.name}
            </h2>
            {!student.active ? (
              <Badge label="Ex-aluno" variant="neutral" />
            ) : null}
          </div>
          {student.active ? (
            <IconButton
              icon="edit"
              size="sm"
              aria-label="Editar informações do aluno"
              onClick={() => setPersonalModalOpen(true)}
            />
          ) : null}
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Responsável: {student.guardianName} | {student.phone}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StudentFinancialCard
          label={financialContent.label}
          tone={financialContent.tone}
          onReceivePayment={
            student.active ? () => setReceivePaymentOpen(true) : undefined
          }
        />

        <StudentSettingsCard
          hourlyRate={student.hourlyRate}
          recurrences={recurrences}
          onEdit={student.active ? () => setSettingsModalOpen(true) : undefined}
        />

        <div className="lg:col-span-2">
          <StudentAttendanceCard sessions={studentClasses} />
        </div>
      </div>
      {student.active ? (
        <Button
          type="button"
          variant="danger"
          className="w-full gap-2"
          onClick={() => setDeactivateModalOpen(true)}
        >
          <Icon name="person_off" className="text-xl" />
          Desativar aluno
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            onClick={() => setReactivateModalOpen(true)}
          >
            <Icon name="person_add" className="text-xl" />
            Ativar aluno
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-full gap-2"
            onClick={() => setDeleteModalOpen(true)}
          >
            <Icon name="delete" className="text-xl" />
            Excluir aluno
          </Button>
        </div>
      )}

      <EditStudentPersonalModal
        open={personalModalOpen}
        student={student}
        onClose={() => setPersonalModalOpen(false)}
        onSaved={() => void loadProfile({ silent: true })}
      />

      <EditStudentSettingsModal
        open={settingsModalOpen}
        student={student}
        recurrences={recurrences}
        onClose={() => setSettingsModalOpen(false)}
        onSaved={() => void loadProfile({ silent: true })}
      />

      <DeactivateStudentModal
        open={deactivateModalOpen}
        student={student}
        onClose={() => setDeactivateModalOpen(false)}
      />

      <ReactivateStudentModal
        open={reactivateModalOpen}
        student={student}
        onClose={() => setReactivateModalOpen(false)}
      />

      <DeleteStudentModal
        open={deleteModalOpen}
        student={student}
        onClose={() => setDeleteModalOpen(false)}
      />

      <ReceivePaymentModal
        open={receivePaymentOpen}
        student={student}
        pending={pending}
        onClose={() => setReceivePaymentOpen(false)}
        onSaved={() => void loadProfile({ silent: true })}
      />
    </div>
  );
}
