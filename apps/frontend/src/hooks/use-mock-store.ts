import { useEffect, useState } from 'react';

import { ensureMockStoreInitialized, subscribe } from '@/mocks';

export function useMockStore(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    ensureMockStoreInitialized();
    return subscribe(() => setVersion((current) => current + 1));
  }, []);

  return version;
}
