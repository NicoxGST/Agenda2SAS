import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type {
  ReservationStatus,
  Reservation,
  ReservationPayload,
} from "../types";

export type { ReservationStatus, Reservation };
export { RESERVATION_STATUS_LABELS } from "../types";

function authHeaders() {
  const auth = getAuth();
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getMyReservations(): Promise<Reservation[]> {
  return apiFetch("/reservations/my", { headers: authHeaders() });
}

export function getWorkerReservations(): Promise<Reservation[]> {
  return apiFetch("/reservations/worker/my", { headers: authHeaders() });
}

export function createReservation(data: ReservationPayload): Promise<Reservation> {
  return apiFetch("/reservations", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateReservationStatus(
  id: number,
  status: ReservationStatus,
): Promise<Reservation> {
  return apiFetch(`/reservations/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}
