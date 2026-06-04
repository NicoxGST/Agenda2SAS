import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";

export type ClientSummary = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type DevicePhoto = {
  id: number;
  deviceId: number;
  url: string;
  description?: string | null;
  createdAt: string;
};

export type DeviceWorkOrderSummary = {
  id: number;
  status: string;
  problemDescription: string;
  diagnosis?: string | null;
  laborCost: number;
  createdAt: string;
};

export type Device = {
  id: number;
  clientId: number;
  brand: string;
  model: string;
  serialNumber?: string | null;
  deviceType: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  client?: ClientSummary;
  photos?: DevicePhoto[];
  workOrders?: DeviceWorkOrderSummary[];
};

export type DevicePayload = {
  clientId?: number;
  brand: string;
  model: string;
  serialNumber?: string;
  deviceType: string;
  description: string;
};

export type DevicePhotoPayload = {
  url: string;
  description?: string;
};

function authHeaders() {
  const auth = getAuth();

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getMyDevices() {
  return apiFetch("/devices/my", {
    headers: authHeaders(),
  });
}

export function getDevices(clientId?: number) {
  const query = clientId ? `?clientId=${clientId}` : "";

  return apiFetch(`/devices${query}`, {
    headers: authHeaders(),
  });
}

export function getDevice(id: number) {
  return apiFetch(`/devices/${id}`, {
    headers: authHeaders(),
  });
}

export function createDevice(data: DevicePayload) {
  return apiFetch("/devices", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateDevice(id: number, data: Partial<DevicePayload>) {
  return apiFetch(`/devices/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function searchClients(search: string) {
  return apiFetch(`/devices/clients?search=${encodeURIComponent(search)}`, {
    headers: authHeaders(),
  });
}

export function getDevicePhotos(deviceId: number) {
  return apiFetch(`/devices/${deviceId}/photos`, {
    headers: authHeaders(),
  });
}

export function createDevicePhoto(deviceId: number, data: DevicePhotoPayload) {
  return apiFetch(`/devices/${deviceId}/photos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteDevicePhoto(id: number) {
  return apiFetch(`/device-photos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
