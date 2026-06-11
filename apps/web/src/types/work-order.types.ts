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

export type WorkOrderPayload = {
  deviceId: number;
  workerId?: number;
  reservationId?: number;
  problemDescription: string;
  diagnosis?: string;
  laborCost: number;
};
