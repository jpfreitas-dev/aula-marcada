import type { Student } from '@/types';
import { addWorkdays, getDefaultAgendaDate } from '@/utils/workday';

function nextClassAt(offsetWorkdays: number, time: string): string {
  const date = addWorkdays(getDefaultAgendaDate(), offsetWorkdays);
  const [hours, minutes] = time.split(':');
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

export const mockStudents: Student[] = [
  {
    id: 'student-joao',
    name: 'João',
    guardianName: 'Carla Silva',
    phone: '(11) 98765-4321',
    email: 'joao@email.com',
    hourlyRate: 50,
    advanceBalance: 100,
    nextClassAt: nextClassAt(1, '08:00'),
    financialStatus: 'advance',
  },
  {
    id: 'student-maria',
    name: 'Maria',
    guardianName: 'Roberto Lima',
    phone: '(11) 91234-5678',
    hourlyRate: 60,
    advanceBalance: 0,
    nextClassAt: nextClassAt(2, '14:00'),
    financialStatus: 'up_to_date',
  },
  {
    id: 'student-pedro',
    name: 'Pedro',
    guardianName: 'Fernanda Costa',
    phone: '(11) 99876-5432',
    hourlyRate: 55,
    advanceBalance: 30,
    nextClassAt: nextClassAt(1, '10:00'),
    financialStatus: 'partial',
  },
  {
    id: 'student-ana',
    name: 'Ana',
    guardianName: 'Paula Mendes',
    phone: '(11) 97654-3210',
    hourlyRate: 65,
    advanceBalance: 0,
    nextClassAt: nextClassAt(1, '14:00'),
    financialStatus: 'partial',
  },
  {
    id: 'student-carlos',
    name: 'Carlos',
    guardianName: 'Juliana Rocha',
    phone: '(11) 96543-2109',
    hourlyRate: 50,
    advanceBalance: 0,
    nextClassAt: nextClassAt(0, '14:00'),
    financialStatus: 'pending',
  },
];
