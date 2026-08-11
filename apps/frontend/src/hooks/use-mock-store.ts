import { useEffect, useState } from 'react';

import { ensureMockStoreInitialized, subscribe } from '@/mocks';

export function useMockStore(): void {
  const [, setVersion] = useState(0);

  useEffect(() => {
    ensureMockStoreInitialized();
    return subscribe(() => setVersion((current) => current + 1));
  }, []);
}
