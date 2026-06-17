import type { WorkOrderStatus } from "./statuses";
import type { Device } from "./device.types";

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

export type WorkOrderDetail = {
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
  device?: {
    id: number;
    brand: string;
    model: string;
    serialNumber?: string | null;
    deviceType: string;
    description: string;
    client?: { id: number; name: string; email: string };
    photos: { id: number; url: string; description?: string | null; createdAt: string }[];
  };
  worker?: { id: number; name: string; email: string; role: string };
  reservation?: {
    id: number;
    scheduledAt: string;
    contactPhone: string;
    clientNotes?: string | null;
    status: string;
    client?: { id: number; name: string; email: string };
    service?: { id: number; name: string; description: string; price: number; isActive: boolean };
  } | null;
};

export type WorkOrderHistoryEntry = {
  id: number;
  previousStatus: WorkOrderStatus;
  newStatus: WorkOrderStatus;
  createdAt: string;
};

export type WorkOrderPayload = {
  deviceId: number;
  workerId?: number;
  reservationId?: number;
  problemDescription: string;
  diagnosis?: string;
  laborCost: number;
};
