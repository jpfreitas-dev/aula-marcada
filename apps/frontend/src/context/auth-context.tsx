import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getStoredAuth,
  login as loginRequest,
  logout as logoutRequest,
} from '@/services/auth-service';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => getStoredAuth() !== null,
  );
  const isLoading = false;

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    logoutRequest();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      login,
      logout,
    }),
    [isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
