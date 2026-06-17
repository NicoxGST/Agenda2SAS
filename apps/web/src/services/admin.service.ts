import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";

export type AdminStats = {
  clients: number;
  workers: number;
  reservations: number;
  pendingReservations: number;
  workOrders: number;
  activeWorkOrders: number;
  readyWorkOrders: number;
  deliveredWorkOrders: number;
};

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  if (!auth.accessToken) return {};
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getStats(): Promise<AdminStats> {
  return apiFetch("/admin/stats", { headers: authHeaders() });
}
