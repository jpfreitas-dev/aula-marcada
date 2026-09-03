const AUTH_STORAGE_KEY = 'aula-marcada.auth';

type StoredAuth = {
  token: string;
  expiresAt: string;
};

type LoginResponse = StoredAuth;

function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredAuth;

    if (!parsed.token || !parsed.expiresAt) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getStoredAuth(): StoredAuth | null {
  const stored = readStoredAuth();

  if (!stored) {
    return null;
  }

  if (new Date(stored.expiresAt).getTime() <= Date.now()) {
    clearStoredAuth();
    return null;
  }

  return stored;
}

export function getStoredToken(): string | null {
  const stored = getStoredAuth();
  return stored?.token ?? null;
}

export function storeAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login(
  email: string,
  password: string,
): Promise<StoredAuth> {
  const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
  const response = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json()) as LoginResponse & { message?: string };

  if (!response.ok) {
    throw new Error(data.message ?? 'Não foi possível entrar.');
  }

  storeAuth(data);
  return data;
}

export function logout() {
  clearStoredAuth();
}
