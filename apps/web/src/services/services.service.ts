import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type { Service, ServicePayload } from "../types";

export type { Service };

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  if (!auth.accessToken) return {};
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getServices(): Promise<Service[]> {
  return apiFetch("/services", { headers: authHeaders() });
}

export function getPublicServices(): Promise<Service[]> {
  return apiFetch("/services/public");
}

export function createService(data: ServicePayload): Promise<Service> {
  return apiFetch("/services", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateService(
  id: number,
  data: Partial<ServicePayload & { isActive: boolean }>,
): Promise<Service> {
  return apiFetch(`/services/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteService(id: number): Promise<void> {
  return apiFetch(`/services/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
