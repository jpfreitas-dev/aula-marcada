import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { EditStudentPersonalModal } from '@/components/students/edit-student-personal-modal';
import { EditStudentSettingsModal } from '@/components/students/edit-student-settings-modal';
import { StudentAttendanceCard } from '@/components/students/student-attendance-card';
import { StudentFinancialCard } from '@/components/students/student-financial-card';
import { StudentSettingsCard } from '@/components/students/student-settings-card';
import { IconButton } from '@/components/ui/icon-button';
import { useProfilePageHeader } from '@/hooks/use-profile-page-header';
import { listClassesByStudent } from '@/services/class-service';
import {
  getStudentByIdService,
  listRecurrencesByStudent,
} from '@/services/student-service';
import type { ClassSession, Student, StudentRecurrence } from '@/types';
import { subscribe } from '@/mocks';
import { calculateStudentPendingSummary } from '@/utils/class-value';
import { getStudentFinancialCardContent } from '@/utils/student-financial';

export function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentClasses, setStudentClasses] = useState<ClassSession[]>([]);
  const [recurrences, setRecurrences] = useState<StudentRecurrence[]>([]);
  const [loading, setLoading] = useState(() => Boolean(id));
  const [personalModalOpen, setPersonalModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  useProfilePageHeader('Perfil do Aluno');

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadProfile = () => {
      void Promise.all([
        getStudentByIdService(id),
        listClassesByStudent(id),
        listRecurrencesByStudent(id),
      ]).then(([loadedStudent, classes, loadedRecurrences]) => {
        setStudent(loadedStudent ?? null);
        setStudentClasses(classes);
        setRecurrences(loadedRecurrences);
        setLoading(false);
      });
    };

    loadProfile();
    return subscribe(loadProfile);
  }, [id]);

  if (loading) {
    return (
      <p className="text-sm text-text-muted">Carregando perfil do aluno...</p>
    );
  }

  if (!student) {
    return (
      <p className="text-sm text-text-muted">
        {id ? 'Aluno não encontrado.' : 'Identificador inválido.'}
      </p>
    );
  }

  const pending = calculateStudentPendingSummary(studentClasses);
  const financialContent = getStudentFinancialCardContent(student, pending);

  return (
    <div className="flex flex-col gap-4">
      <section className="border-b border-outline-variant/30 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-text-main">
            {student.name}
          </h2>
          <IconButton
            icon="edit"
            size="sm"
            aria-label="Editar informações do aluno"
            onClick={() => setPersonalModalOpen(true)}
          />
        </div>
        <p className="mt-1 text-sm text-text-muted">
          Responsável: {student.guardianName} | {student.phone}
        </p>
      </section>

      <StudentFinancialCard
        label={financialContent.label}
        tone={financialContent.tone}
      />

      <StudentSettingsCard
        hourlyRate={student.hourlyRate}
        recurrences={recurrences}
        onEdit={() => setSettingsModalOpen(true)}
      />

      <StudentAttendanceCard sessions={studentClasses} />

      <EditStudentPersonalModal
        open={personalModalOpen}
        student={student}
        onClose={() => setPersonalModalOpen(false)}
      />

      <EditStudentSettingsModal
        open={settingsModalOpen}
        student={student}
        recurrences={recurrences}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
}
