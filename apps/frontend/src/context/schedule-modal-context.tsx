import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { BottomSheet } from '@/components/ui/bottom-sheet';

type ScheduleModalContextValue = {
  openScheduleModal: () => void;
  closeScheduleModal: () => void;
};

const ScheduleModalContext = createContext<ScheduleModalContextValue | null>(
  null,
);

export function ScheduleModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openScheduleModal = useCallback(() => setOpen(true), []);
  const closeScheduleModal = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({ openScheduleModal, closeScheduleModal }),
    [openScheduleModal, closeScheduleModal],
  );

  return (
    <ScheduleModalContext.Provider value={value}>
      {children}
      <BottomSheet
        open={open}
        title="Agendar aula"
        onClose={closeScheduleModal}
      >
        <p className="text-sm text-text-muted">
          O formulário completo de agendamento será implementado na próxima
          fase. Por enquanto, este painel confirma a navegação e o primitivo de
          bottom sheet.
        </p>
      </BottomSheet>
    </ScheduleModalContext.Provider>
  );
}

export function useScheduleModal(): ScheduleModalContextValue {
  const context = useContext(ScheduleModalContext);

  if (!context) {
    throw new Error(
      'useScheduleModal must be used within ScheduleModalProvider',
    );
  }

  return context;
}
