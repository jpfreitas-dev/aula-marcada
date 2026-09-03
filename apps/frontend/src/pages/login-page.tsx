import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  fieldControlClassName,
  fieldLabelClassName,
} from '@/components/ui/field';
import { useAuth } from '@/context/auth-context';
import { getApiErrorMessage } from '@/utils/api-error';

export function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath =
    (location.state as { from?: { pathname: string } } | null)?.from
      ?.pathname ?? '/';

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Não foi possível entrar.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-subtle px-margin-main py-stack-md pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-6">
      <section className="w-full max-w-lg rounded-md border border-outline-variant/30 bg-surface p-card-padding shadow-sm">
        <h1 className="font-display text-headline-md font-semibold text-purple-900">
          Aula Marcada
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Entre com seu email e senha para acessar o sistema.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className={fieldLabelClassName}>E-mail</span>
            <input
              type="email"
              className={`${fieldControlClassName} px-3`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className={fieldLabelClassName}>Senha</span>
            <input
              type="password"
              className={`${fieldControlClassName} px-3`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? (
            <p className="text-sm text-status-danger">{errorMessage}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </section>
    </div>
  );
}
