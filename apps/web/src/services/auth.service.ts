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

export async function verifyResetCode(email: string, code: string) {
  return apiFetch('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function forgotPassword(email: string) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, code, newPassword }),
  });
}

export async function verifyEmail(email: string, code: string) {
  return apiFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function resendVerificationCode(email: string) {
  return apiFetch('/auth/resend-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}