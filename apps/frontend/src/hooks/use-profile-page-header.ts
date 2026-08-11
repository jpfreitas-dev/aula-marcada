import { useEffect } from 'react';

import { usePageHeaderContext } from '@/context/page-header-context';

export function useProfilePageHeader(title: string, backTo = '/students') {
  const { setVariant, setProfileTitle, setProfileBackTo, setHeaderChildren } =
    usePageHeaderContext();

  useEffect(() => {
    setVariant('profile');
    setProfileTitle(title);
    setProfileBackTo(backTo);
    setHeaderChildren(null);

    return () => {
      setVariant('default');
      setProfileTitle('');
      setProfileBackTo('/students');
    };
  }, [
    backTo,
    setHeaderChildren,
    setProfileBackTo,
    setProfileTitle,
    setVariant,
    title,
  ]);
}
