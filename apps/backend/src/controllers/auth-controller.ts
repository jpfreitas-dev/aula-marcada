import type { Request, Response } from 'express';
import { z } from 'zod';

import { login } from '@/services/auth/login';

const loginSchema = z.object({
  email: z.string().trim().min(1),
  password: z.string().min(1),
});

class AuthController {
  async login(request: Request, response: Response) {
    const body = loginSchema.parse(request.body);
    const result = login.execute({
      email: body.email,
      password: body.password,
    });

    return response.status(200).json(result);
  }
}

export const authController = new AuthController();
