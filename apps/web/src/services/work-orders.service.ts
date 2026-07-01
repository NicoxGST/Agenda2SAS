import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type { WorkOrderStatus, WorkOrder, WorkOrderDetail, WorkOrderHistoryEntry, WorkOrderPayload, WorkOrderProduct } from "../types";

export type { WorkOrderStatus, WorkOrder, WorkOrderDetail, WorkOrderHistoryEntry, WorkOrderProduct };
export { WORK_ORDER_STATUS_LABELS } from "../types";

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  if (!auth.accessToken) return {};
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export type WorkOrderFilters = {
  status?: string;
  workerId?: number;
  clientId?: number;
  from?: string;
  to?: string;
};

export function getWorkOrders(filters?: WorkOrderFilters): Promise<WorkOrder[]> {
  const qs = new URLSearchParams();
  if (filters?.status)   qs.set("status",   filters.status);
  if (filters?.workerId) qs.set("workerId", String(filters.workerId));
  if (filters?.clientId) qs.set("clientId", String(filters.clientId));
  if (filters?.from)     qs.set("from",     filters.from);
  if (filters?.to)       qs.set("to",       filters.to);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiFetch(`/work-orders${query}`, { headers: authHeaders() });
}

export function getWorkOrderDetail(id: number): Promise<WorkOrderDetail> {
  return apiFetch(`/work-orders/${id}`, { headers: authHeaders() });
}

export function getWorkOrderHistory(id: number): Promise<WorkOrderHistoryEntry[]> {
  return apiFetch(`/work-orders/${id}/history`, { headers: authHeaders() });
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

export function addWorkOrderProduct(
  workOrderId: number,
  productId: number,
  quantity: number,
): Promise<WorkOrderProduct> {
  return apiFetch(`/work-orders/${workOrderId}/products`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ productId, quantity }),
  });
}

export function removeWorkOrderProduct(
  workOrderId: number,
  entryId: number,
): Promise<{ id: number }> {
  return apiFetch(`/work-orders/${workOrderId}/products/${entryId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
