import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ScheduleClassModal,
  type ScheduleSlot,
} from '@/components/classes/schedule-class-modal';

type ScheduleModalContextValue = {
  openScheduleModal: (slot?: ScheduleSlot) => void;
  closeScheduleModal: () => void;
};

const ScheduleModalContext = createContext<ScheduleModalContextValue | null>(
  null,
);

export function ScheduleModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [initialSlot, setInitialSlot] = useState<ScheduleSlot | undefined>();

  const openScheduleModal = useCallback((slot?: ScheduleSlot) => {
    setInitialSlot(slot);
    setOpen(true);
  }, []);

  const closeScheduleModal = useCallback(() => {
    setOpen(false);
    setInitialSlot(undefined);
  }, []);

  const value = useMemo(
    () => ({ openScheduleModal, closeScheduleModal }),
    [openScheduleModal, closeScheduleModal],
  );

  return (
    <ScheduleModalContext.Provider value={value}>
      {children}
      <ScheduleClassModal
        open={open}
        initialSlot={initialSlot}
        onClose={closeScheduleModal}
      />
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
