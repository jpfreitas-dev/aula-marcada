import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

export type PageHeaderVariant = 'default' | 'profile';

type PageHeaderContextValue = {
  headerChildren: ReactNode | null;
  setHeaderChildren: Dispatch<SetStateAction<ReactNode | null>>;
  variant: PageHeaderVariant;
  setVariant: Dispatch<SetStateAction<PageHeaderVariant>>;
  profileTitle: string;
  setProfileTitle: Dispatch<SetStateAction<string>>;
  profileBackTo: string;
  setProfileBackTo: Dispatch<SetStateAction<string>>;
};

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [headerChildren, setHeaderChildren] = useState<ReactNode | null>(null);
  const [variant, setVariant] = useState<PageHeaderVariant>('default');
  const [profileTitle, setProfileTitle] = useState('');
  const [profileBackTo, setProfileBackTo] = useState('/students');

  const value = useMemo(
    () => ({
      headerChildren,
      setHeaderChildren,
      variant,
      setVariant,
      profileTitle,
      setProfileTitle,
      profileBackTo,
      setProfileBackTo,
    }),
    [headerChildren, variant, profileTitle, profileBackTo],
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
