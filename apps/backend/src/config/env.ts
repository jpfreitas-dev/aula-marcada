function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseFrontendUrls(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

export const env = {
  jwtSecret: requireEnv('JWT_SECRET'),
  authEmail: requireEnv('AUTH_EMAIL').trim().toLowerCase(),
  authPassword: requireEnv('AUTH_PASSWORD'),
  frontendUrls: parseFrontendUrls(
    process.env.FRONTEND_URL ?? 'http://localhost:5173',
  ),
  jwtExpiresIn: '7d' as const,
  loginRateLimitMax: parsePositiveInt(process.env.LOGIN_RATE_LIMIT_MAX, 5),
  loginRateLimitWindowMs: parsePositiveInt(
    process.env.LOGIN_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  ),
  jsonBodyLimit: process.env.JSON_BODY_LIMIT ?? '1mb',
};
