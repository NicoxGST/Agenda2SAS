import { apiFetch } from './api';
import { getAuth } from '../store/auth.store';

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getUsers() {
  return apiFetch('/users', {
    headers: authHeaders(),
  });
}

export function deleteUser(id: number) {
  return apiFetch(`/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
}

export function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  return apiFetch('/users', {
    method: 'POST',

    headers: authHeaders(),

    body: JSON.stringify(data),
  });
}

export function updateUserRole(
  id: number,
  role: string,
) {
  return apiFetch(
    `/users/${id}/role`,
    {
      method: 'PATCH',

      headers:
        authHeaders(),

      body:
        JSON.stringify({
          role,
        }),
    },
  );
}