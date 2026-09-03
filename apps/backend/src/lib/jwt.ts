import jwt from 'jsonwebtoken';

import { env } from '@/config/env';

type AuthTokenPayload = {
  sub: 'teacher';
};

export type VerifiedAuthToken = AuthTokenPayload & {
  iat: number;
  exp: number;
};

export function signAuthToken(): { token: string; expiresAt: string } {
  const token = jwt.sign({ sub: 'teacher' }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

  const decoded = jwt.decode(token) as VerifiedAuthToken;
  const expiresAt = new Date(decoded.exp * 1000).toISOString();

  return { token, expiresAt };
}

export function verifyAuthToken(token: string): VerifiedAuthToken {
  return jwt.verify(token, env.jwtSecret) as VerifiedAuthToken;
}
