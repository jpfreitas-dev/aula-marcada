import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { usePageHeaderContext } from '@/context/page-header-context';

export function usePageHeader(children: ReactNode | null) {
  const { setHeaderChildren } = usePageHeaderContext();
  const location = useLocation();

  useEffect(() => {
    setHeaderChildren(children);
    return () => setHeaderChildren(null);
  }, [children, location.pathname, setHeaderChildren]);
}
