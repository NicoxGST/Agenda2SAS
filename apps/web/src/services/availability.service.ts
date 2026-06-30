import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type {
  Worker,
  WorkerAvailability,
  AvailableSlot,
  AvailabilityPayload,
} from "../types";

export type { Worker, WorkerAvailability, AvailableSlot };

function authHeaders() {
  const auth = getAuth();
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getWorkers(): Promise<Worker[]> {
  return apiFetch("/availability/workers", { headers: authHeaders() });
}

export function getAvailability(workerId?: number): Promise<WorkerAvailability[]> {
  const query = workerId ? `?workerId=${workerId}` : "";
  return apiFetch(`/availability${query}`, { headers: authHeaders() });
}

export function getWorkerSchedule(workerId: number): Promise<Pick<WorkerAvailability, 'dayOfWeek' | 'specificDate' | 'startTime' | 'endTime' | 'slotMinutes'>[]> {
  return apiFetch(`/availability/worker-schedule?workerId=${workerId}`, { headers: authHeaders() });
}

export function getAvailableSlots(workerId: number, date: string): Promise<AvailableSlot[]> {
  return apiFetch(
    `/availability/available-slots?workerId=${workerId}&date=${date}`,
    { headers: authHeaders() },
  );
}

export function createAvailability(data: AvailabilityPayload): Promise<WorkerAvailability> {
  return apiFetch("/availability", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateAvailability(
  id: number,
  data: Partial<AvailabilityPayload & { isActive: boolean }>,
): Promise<WorkerAvailability> {
  return apiFetch(`/availability/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteAvailability(id: number): Promise<void> {
  return apiFetch(`/availability/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
