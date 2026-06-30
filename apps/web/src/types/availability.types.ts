import type { Worker } from "./user.types";

export type WorkerAvailability = {
  id: number;
  workerId: number;
  dayOfWeek: number;
  specificDate?: string | null;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive: boolean;
  worker?: Worker;
};

export type AvailableSlot = {
  time: string;
  scheduledAt: string;
};

export type AvailabilityPayload = {
  workerId: number;
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};
