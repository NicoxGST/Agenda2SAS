import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type { Service } from "./services.service";
import type { Worker } from "./availability.service";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ATTENDED"
  | "CANCELLED"
  | "NO_SHOW";

export const RESERVATION_STATUS_LABELS: Record<
  ReservationStatus,
  string
> = {
  PENDING: "PENDIENTE",
  CONFIRMED: "CONFIRMADA",
  ATTENDED: "ATENDIDA",
  CANCELLED: "CANCELADA",
  NO_SHOW: "NO ASISTIÓ",
};

export type Reservation = {
  id: number;
  clientId: number;
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  clientNotes?: string | null;
  contactPhone: string;
  depositAmount: number;
  status: ReservationStatus;
  client?: Worker;
  worker?: Worker;
  service?: Service;
};

type ReservationPayload = {
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  contactPhone: string;
  clientNotes?: string;
  depositAmount: number;
};

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getMyReservations() {
  return apiFetch("/reservations/my", {
    headers: authHeaders(),
  });
}

export function getWorkerReservations() {
  return apiFetch("/reservations/worker/my", {
    headers: authHeaders(),
  });
}

export function createReservation(data: ReservationPayload) {
  return apiFetch("/reservations", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateReservationStatus(id: number, status: ReservationStatus) {
  return apiFetch(`/reservations/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}
