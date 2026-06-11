import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type { WorkOrderStatus, WorkOrder, WorkOrderPayload } from "../types";

export type { WorkOrderStatus, WorkOrder };
export { WORK_ORDER_STATUS_LABELS } from "../types";

function authHeaders() {
  const auth = getAuth();
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getWorkOrders(): Promise<WorkOrder[]> {
  return apiFetch("/work-orders", { headers: authHeaders() });
}

export function createWorkOrder(data: WorkOrderPayload): Promise<WorkOrder> {
  return apiFetch("/work-orders", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateWorkOrder(
  id: number,
  data: Partial<WorkOrderPayload>,
): Promise<WorkOrder> {
  return apiFetch(`/work-orders/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateWorkOrderStatus(
  id: number,
  status: WorkOrderStatus,
): Promise<WorkOrder> {
  return apiFetch(`/work-orders/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
}
