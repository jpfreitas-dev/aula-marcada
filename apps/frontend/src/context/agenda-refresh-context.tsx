import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type AgendaRefreshContextValue = {
  version: number;
  refresh: () => void;
};

const AgendaRefreshContext = createContext<AgendaRefreshContextValue | null>(
  null,
);

export function AgendaRefreshProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  const value = useMemo(() => ({ version, refresh }), [version, refresh]);

  return (
    <AgendaRefreshContext.Provider value={value}>
      {children}
    </AgendaRefreshContext.Provider>
  );
}

export function useAgendaRefresh(): AgendaRefreshContextValue {
  const context = useContext(AgendaRefreshContext);

  if (!context) {
    throw new Error(
      'useAgendaRefresh must be used within AgendaRefreshProvider',
    );
  }

  return context;
}
