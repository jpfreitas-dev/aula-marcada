import type { NextFunction, Request, Response } from 'express';

import { AppError } from '@/lib/app-error';
import { verifyAuthToken } from '@/lib/jwt';

export function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError('Não autorizado.', 401));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  if (!token) {
    next(new AppError('Não autorizado.', 401));
    return;
  }

  try {
    verifyAuthToken(token);
    next();
  } catch {
    next(new AppError('Não autorizado.', 401));
  }
}
