import { AuthProvider } from '@/context/auth-context';
import { AppRoutes } from '@/routes/app-routes';

export function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
