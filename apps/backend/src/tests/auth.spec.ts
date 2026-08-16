import request from 'supertest';

import { app } from '@/app';
import { authRequest } from './helpers/auth-request';

const testEmail = process.env.AUTH_EMAIL ?? 'test@example.com';
const testPassword = process.env.AUTH_PASSWORD ?? 'test-password';

describe('auth API', () => {
  it('logs in with the configured credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.expiresAt).toEqual(expect.any(String));
  });

  it('rejects invalid credentials with a generic message', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email ou senha inválidos.');
  });

  it('rejects invalid email with the same generic message', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: testPassword });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Email ou senha inválidos.');
  });

  it('rejects protected routes without a token', async () => {
    const response = await request(app).get('/students');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Não autorizado.');
  });

  it('rejects protected routes with an invalid token', async () => {
    const response = await request(app)
      .get('/students')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Não autorizado.');
  });

  it('rejects protected routes with malformed authorization header', async () => {
    const response = await request(app)
      .get('/students')
      .set('Authorization', 'invalid-format');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Não autorizado.');
  });

  it('allows protected routes with a valid token', async () => {
    const response = await authRequest.get('/students');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('rate limits repeated failed login attempts', async () => {
    let blockedAttempt: Awaited<ReturnType<typeof request>> | undefined;

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testEmail, password: 'wrong-password' });

      if (response.status === 429) {
        blockedAttempt = response;
        break;
      }

      expect(response.status).toBe(401);
    }

    expect(blockedAttempt?.status).toBe(429);
    expect(blockedAttempt?.body.message).toBe(
      'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.',
    );
  });
});
