import { useEffect, useMemo, useState } from "react";

import { ROLES } from "../../../constants/roles";
import { useAuth } from "../../../store/auth.store";
import type {
  Worker,
  WorkerAvailability,
  AvailabilityPayload,
} from "../../../types";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  getWorkers,
  updateAvailability,
} from "../../../services/availability.service";

export type AvailabilityFormState = {
  workerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: string;
};

const emptyAvailabilityForm: AvailabilityFormState = {
  workerId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: "60",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function useWorkerData() {
  const auth = useAuth();
  const user = auth.user;
  const isWorker      = user?.role === ROLES.WORKER;
  const canPickWorker = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [workers, setWorkers]           = useState<Worker[]>([]);
  const [availability, setAvailability] = useState<WorkerAvailability[]>([]);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);

  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityFormState>(() => ({
    ...emptyAvailabilityForm,
    workerId: isWorker && user ? String(user.id) : "",
  }));

  const selectedWorkerId = useMemo(
    () => Number(availabilityForm.workerId || user?.id || 0),
    [availabilityForm.workerId, user?.id],
  );

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");
        const [availabilityData, workerData] = await Promise.all([
          getAvailability(isWorker && user ? user.id : undefined),
          canPickWorker ? getWorkers() : Promise.resolve([]),
        ]);
        if (!ignore) {
          setAvailability(availabilityData);
          if (canPickWorker) setWorkers(workerData);
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialData();
    return () => { ignore = true; };
  }, [canPickWorker, isWorker, user]);

  useEffect(() => {
    if (!canPickWorker || !selectedWorkerId) return;
    let ignore = false;

    async function loadWorkerAvailability() {
      try {
        const data = await getAvailability(selectedWorkerId);
        if (!ignore) setAvailability(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadWorkerAvailability();
    return () => { ignore = true; };
  }, [canPickWorker, selectedWorkerId]);

  function updateAvailabilityForm(key: keyof AvailabilityFormState, value: string) {
    setAvailabilityForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateAvailability() {
    try {
      setError("");
      setLoading(true);
      const payload: AvailabilityPayload = {
        workerId: selectedWorkerId,
        dayOfWeek: Number(availabilityForm.dayOfWeek),
        startTime: availabilityForm.startTime,
        endTime: availabilityForm.endTime,
        slotMinutes: Number(availabilityForm.slotMinutes),
      };
      if (!payload.workerId || payload.dayOfWeek < 0 || !payload.startTime || !payload.endTime || payload.slotMinutes < 15) {
        throw new Error("Completa la disponibilidad");
      }
      const created = await createAvailability(payload);
      setAvailability((prev) => [...prev, created]);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleAvailability(item: WorkerAvailability) {
    try {
      setError("");
      const updated = await updateAvailability(item.id, { isActive: !item.isActive });
      setAvailability((prev) => prev.map((a) => (a.id === item.id ? updated : a)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDeleteAvailability(id: number) {
    try {
      setError("");
      await deleteAvailability(id);
      setAvailability((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return {
    isWorker,
    canPickWorker,
    workers,
    availability,
    error,
    loading,
    availabilityForm,
    selectedWorkerId,
    updateAvailabilityForm,
    handleCreateAvailability,
    handleToggleAvailability,
    handleDeleteAvailability,
  };
}
