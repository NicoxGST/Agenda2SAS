import type { ReservationStatus } from "./statuses";
import type { Worker } from "./user.types";
import type { Service } from "./service.types";

export type Reservation = {
  id: number;
  clientId: number;
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  clientNotes?: string | null;
  contactPhone: string;
  depositAmount: number;
  status: ReservationStatus;
  client?: Worker;
  worker?: Worker;
  service?: Service;
};

export type ReservationPayload = {
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  contactPhone: string;
  clientNotes?: string;
  depositAmount: number;
};
