import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type PageHeaderContextValue = {
  headerChildren: ReactNode | null;
  setHeaderChildren: Dispatch<SetStateAction<ReactNode | null>>;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerChildren, setHeaderChildren] = useState<ReactNode | null>(null);

  const value = useMemo(
    () => ({ headerChildren, setHeaderChildren }),
    [headerChildren],
  );

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeaderContext(): PageHeaderContextValue {
  const context = useContext(PageHeaderContext);

  if (!context) {
    throw new Error(
      'usePageHeaderContext must be used within PageHeaderProvider',
    );
  }

  return context;
}
