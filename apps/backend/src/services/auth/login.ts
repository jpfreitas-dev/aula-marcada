import { env } from '@/config/env';
import { AppError } from '@/lib/app-error';
import { signAuthToken } from '@/lib/jwt';
import { secureCompare } from '@/utils/secure-compare';

type LoginInput = {
  email: string;
  password: string;
};

const INVALID_CREDENTIALS_MESSAGE = 'Email ou senha inválidos.';

export class Login {
  execute(input: LoginInput) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const emailMatches = secureCompare(normalizedEmail, env.authEmail);
    const passwordMatches = secureCompare(input.password, env.authPassword);

    if (!emailMatches || !passwordMatches) {
      throw new AppError(INVALID_CREDENTIALS_MESSAGE, 401);
    }

    return signAuthToken();
  }
}

export const login = new Login();
