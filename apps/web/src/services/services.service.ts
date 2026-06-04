import { apiFetch } from './api';
import { getAuth } from '../store/auth.store';

export type Service = {
  id: number;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
};

type ServicePayload = {
  name: string;
  description: string;
  price: number;
};

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getServices() {
  return apiFetch('/services', {
    headers: authHeaders(),
  });
}

export function getPublicServices() {
  return apiFetch('/services/public');
}

export function createService(
  data: ServicePayload,
) {
  return apiFetch('/services', {
    method: 'POST',

    headers: authHeaders(),

    body: JSON.stringify(data),
  });
}

export function updateService(
  id: number,
  data: Partial<
    ServicePayload & {
      isActive: boolean;
    }
  >,
) {
  return apiFetch(`/services/${id}`, {
    method: 'PATCH',

    headers: authHeaders(),

    body: JSON.stringify(data),
  });
}

export function deleteService(id: number) {
  return apiFetch(`/services/${id}`, {
    method: 'DELETE',

    headers: authHeaders(),
  });
}
