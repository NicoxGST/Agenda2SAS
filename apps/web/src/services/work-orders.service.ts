import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type { Device } from "./devices.service";

export type WorkOrderStatus =
  | "RECEIVED"
  | "DIAGNOSIS"
  | "WAITING_PARTS"
  | "IN_REPAIR"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  RECEIVED: "RECIBIDO",
  DIAGNOSIS: "DIAGNÓSTICO",
  WAITING_PARTS: "ESPERANDO PIEZAS",
  IN_REPAIR: "EN REPARACIÓN",
  READY: "LISTO",
  DELIVERED: "ENTREGADO",
  CANCELLED: "CANCELADO",
};

export type WorkOrder = {
  id: number;
  deviceId: number;
  workerId: number;
  reservationId?: number | null;
  problemDescription: string;
  diagnosis?: string | null;
  laborCost: number;
  status: WorkOrderStatus;
  createdAt: string;
  updatedAt: string;
  device?: Device;
  worker?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

export type WorkOrderPayload = {
  deviceId: number;
  workerId?: number;
  reservationId?: number;
  problemDescription: string;
  diagnosis?: string;
  laborCost: number;
};

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getWorkOrders() {
  return apiFetch("/work-orders", {
    headers: authHeaders(),
  });
}

export function createWorkOrder(data: WorkOrderPayload) {
  return apiFetch("/work-orders", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateWorkOrder(id: number, data: Partial<WorkOrderPayload>) {
  return apiFetch(`/work-orders/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateWorkOrderStatus(id: number, status: WorkOrderStatus) {
  return apiFetch(`/work-orders/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}
