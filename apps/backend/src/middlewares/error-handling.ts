import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '@/lib/app-error';

export const errorHandling: ErrorRequestHandler = (
  error,
  _request,
  response,
  // Required 4-arg signature so Express treats this as error middleware.
  _next,
) => {
  void _next;
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    });

    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Erro de validação',
      issues: error.format(),
    });

    return;
  }

  response.status(500).json({
    message: 'Erro interno do servidor',
  });
};
