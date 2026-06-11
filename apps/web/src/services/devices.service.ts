import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";
import type {
  ClientSummary,
  DevicePhoto,
  Device,
  DeviceDetailsData,
  DevicePayload,
  DevicePhotoPayload,
} from "../types";

export type {
  ClientSummary,
  DevicePhoto,
  Device,
  DeviceDetailsData,
};

function authHeaders() {
  const auth = getAuth();
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function getMyDevices(): Promise<Device[]> {
  return apiFetch("/devices/my", { headers: authHeaders() });
}

export function getDevices(clientId?: number): Promise<Device[]> {
  const query = clientId ? `?clientId=${clientId}` : "";
  return apiFetch(`/devices${query}`, { headers: authHeaders() });
}

export function getDevice(id: number): Promise<Device> {
  return apiFetch(`/devices/${id}`, { headers: authHeaders() });
}

export function getDeviceDetails(id: number): Promise<DeviceDetailsData> {
  return apiFetch(`/devices/${id}/details`, { headers: authHeaders() });
}

export function createDevice(data: DevicePayload): Promise<Device> {
  return apiFetch("/devices", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateDevice(id: number, data: Partial<DevicePayload>): Promise<Device> {
  return apiFetch(`/devices/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function searchClients(search: string): Promise<ClientSummary[]> {
  return apiFetch(
    `/devices/clients?search=${encodeURIComponent(search)}`,
    { headers: authHeaders() },
  );
}

export function getDevicePhotos(deviceId: number): Promise<DevicePhoto[]> {
  return apiFetch(`/devices/${deviceId}/photos`, { headers: authHeaders() });
}

export function createDevicePhoto(
  deviceId: number,
  data: DevicePhotoPayload,
): Promise<DevicePhoto> {
  return apiFetch(`/devices/${deviceId}/photos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteDevicePhoto(id: number): Promise<void> {
  return apiFetch(`/device-photos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}
