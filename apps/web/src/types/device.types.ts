import type { WorkOrderStatus } from "./statuses";
import type { ClientSummary } from "./user.types";

export type DevicePhoto = {
  id: number;
  deviceId: number;
  url: string;
  description?: string | null;
  createdAt: string;
};

export type DeviceWorkOrderSummary = {
  id: number;
  status: WorkOrderStatus;
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

export type DeviceDetailsWorker = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export type DeviceDetailsReservation = {
  id: number;
  clientId: number;
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  clientNotes?: string | null;
  contactPhone: string;
  depositAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  worker?: DeviceDetailsWorker;
  service?: {
    id: number;
    name: string;
    description: string;
    price: number;
    isActive: boolean;
  };
};

export type DeviceDetailsWorkOrder = {
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
  worker?: DeviceDetailsWorker;
};

export type DeviceDetailsData = Omit<Device, "workOrders"> & {
  client: ClientSummary;
  photos: DevicePhoto[];
  reservations: DeviceDetailsReservation[];
  workOrders: DeviceDetailsWorkOrder[];
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
