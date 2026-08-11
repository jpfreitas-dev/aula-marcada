import { useEffect, type ReactNode } from 'react';

import { usePageHeaderContext } from '@/context/page-header-context';

export function usePageHeader(children: ReactNode | null) {
  const { setHeaderChildren } = usePageHeaderContext();

  useEffect(() => {
    setHeaderChildren(children);
    return () => setHeaderChildren(null);
  }, [children, setHeaderChildren]);
}
