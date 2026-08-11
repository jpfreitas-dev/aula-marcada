import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ClassDetailModal } from '@/components/classes/class-detail-modal';

type ClassDetailContextValue = {
  openClassDetail: (classId: string) => void;
  closeClassDetail: () => void;
};

const ClassDetailContext = createContext<ClassDetailContextValue | null>(null);

export function ClassDetailProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState<string | null>(null);

  const openClassDetail = useCallback((id: string) => {
    setClassId(id);
    setOpen(true);
  }, []);

  const closeClassDetail = useCallback(() => {
    setOpen(false);
    setClassId(null);
  }, []);

  const value = useMemo(
    () => ({ openClassDetail, closeClassDetail }),
    [openClassDetail, closeClassDetail],
  );

  return (
    <ClassDetailContext.Provider value={value}>
      {children}
      <ClassDetailModal
        open={open}
        classId={classId}
        onClose={closeClassDetail}
      />
    </ClassDetailContext.Provider>
  );
}

export function useClassDetail(): ClassDetailContextValue {
  const context = useContext(ClassDetailContext);

  if (!context) {
    throw new Error('useClassDetail must be used within ClassDetailProvider');
  }

  return context;
}
