import request from 'supertest';

import { app } from '@/app';
import { getAuthToken } from './auth-token';

type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

function withAuth(method: HttpMethod, url: string) {
  return request(app)
    [method](url)
    .set('Authorization', `Bearer ${getAuthToken()}`);
}

export const authRequest = {
  get: (url: string) => withAuth('get', url),
  post: (url: string) => withAuth('post', url),
  patch: (url: string) => withAuth('patch', url),
  delete: (url: string) => withAuth('delete', url),
};
