import { apiFetch } from './api';

export async function login(
  email: string,
  password: string,
) {
  return apiFetch(
    '/auth/login',
    {
      method: 'POST',

      body: JSON.stringify({
        email,
        password,
      }),
    },
  );
}

export async function logoutRequest(
  token: string,
) {
  return apiFetch(
    '/auth/logout',
    {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    },
  );
}

export async function register(
  name: string,
  email: string,
  password: string,
) {
  return apiFetch(
    '/auth/register',
    {
      method: 'POST',

      body: JSON.stringify({
        name,
        email,
        password,
      }),
    },
  );
}

export async function refreshSession(
  refreshToken: string,
) {
  return apiFetch(
    '/auth/refresh',
    {
      method: 'POST',

      body: JSON.stringify({
        refreshToken,
      }),
    },
  );
}

export async function getMe(
  token: string,
) {
  return apiFetch(
    '/auth/me',
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    },
  );
}