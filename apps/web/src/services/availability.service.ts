import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";

export type Worker = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type WorkerAvailability = {
  id: number;
  workerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
  worker?: Worker;
};

export type AvailableSlot = {
  time: string;
  scheduledAt: string;
};

type AvailabilityPayload = {
  workerId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getWorkers() {
  return apiFetch("/availability/workers", {
    headers: authHeaders(),
  });
}

export function getAvailability(workerId?: number) {
  const query = workerId ? `?workerId=${workerId}` : "";

  return apiFetch(`/availability${query}`, {
    headers: authHeaders(),
  });
}

export function getAvailableSlots(workerId: number, date: string) {
  return apiFetch(`/availability/available-slots?workerId=${workerId}&date=${date}`, {
    headers: authHeaders(),
  });
}

export function createAvailability(data: AvailabilityPayload) {
  return apiFetch("/availability", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateAvailability(
  id: number,
  data: Partial<AvailabilityPayload & { isActive: boolean }>,
) {
  return apiFetch(`/availability/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteAvailability(id: number) {
  return apiFetch(`/availability/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
