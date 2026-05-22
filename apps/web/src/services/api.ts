import { getAuth, setAuth, logout, } from '../store/auth.store';
import { getMe } from './auth.service';

const API_URL =
  'http://localhost:3000';

export async function apiFetch(
  endpoint: string,
  options?: RequestInit,
) {

  async function execute() {

    return fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          'Content-Type':
            'application/json',

          ...options?.headers,
        },
      },
    );
  }

  let response =
    await execute();

  if (
    response.status === 401 &&
    endpoint !==
      '/auth/login' &&
    endpoint !==
      '/auth/refresh'
  ) {

    try {

      const auth =
        getAuth();

      if (
        !auth.refreshToken
      ) {
        logout();

        throw new Error(
          'Session expired',
        );
      }

      const tokens =
        await refreshSession(
          auth.refreshToken,
        );

      const user =
        await getMe(
          tokens.accessToken,
        );

      setAuth(
        tokens.accessToken,
        tokens.refreshToken,
        user,
      );

      response =
        await fetch(
          `${API_URL}${endpoint}`,
          {
            ...options,

          headers: {
            'Content-Type':
              'application/json',

            ...options?.headers,

            Authorization:
              `Bearer ${tokens.accessToken}`,
          }
          },
        );

    } catch {

      logout();

      throw new Error(
        'Session expired',
      );
    }
  }

  let data = null;

  try {

    data =
      await response.json();

  } catch {

    data = null;
  }

  if (!response.ok) {

    throw new Error(
      data?.message ||
      'Request failed',
    );
  }

  return data;
}

async function refreshSession(
  refreshToken: string,
) {

  const response =
    await fetch(
      `${API_URL}/auth/refresh`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          refreshToken,
        }),
      },
    );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      'Refresh failed',
    );
  }

  return data;
}