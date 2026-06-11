import { useEffect, useMemo, useState } from "react";

import { ROLES } from "../../../constants/roles";
import { useAuth } from "../../../store/auth.store";
import type {
  Worker,
  WorkerAvailability,
  AvailabilityPayload,
  ClientSummary,
  Device,
  DevicePayload,
  Reservation,
  ReservationStatus,
  DevicePhoto,
} from "../../../types";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  getWorkers,
  updateAvailability,
} from "../../../services/availability.service";
import {
  getWorkerReservations,
  updateReservationStatus,
} from "../../../services/reservations.service";
import {
  createDevice,
  getDevices,
  searchClients,
  updateDevice,
} from "../../../services/devices.service";

export type AvailabilityFormState = {
  workerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: string;
};

export type DeviceFormState = {
  clientId: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  description: string;
};

const emptyAvailabilityForm: AvailabilityFormState = {
  workerId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: "60",
};

const emptyDeviceForm: DeviceFormState = {
  clientId: "", brand: "", model: "",
  serialNumber: "", deviceType: "", description: "",
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

  const [workers, setWorkers]               = useState<Worker[]>([]);
  const [availability, setAvailability]     = useState<WorkerAvailability[]>([]);
  const [reservations, setReservations]     = useState<Reservation[]>([]);
  const [clients, setClients]               = useState<ClientSummary[]>([]);
  const [devices, setDevices]               = useState<Device[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientSearch, setClientSearch]     = useState("");
  const [editingDeviceId, setEditingDeviceId]   = useState<number | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const [availabilityForm, setAvailabilityForm] = useState<AvailabilityFormState>(() => ({
    ...emptyAvailabilityForm,
    workerId: isWorker && user ? String(user.id) : "",
  }));
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(emptyDeviceForm);

  const selectedWorkerId = useMemo(
    () => Number(availabilityForm.workerId || user?.id || 0),
    [availabilityForm.workerId, user?.id],
  );

  // Carga inicial: disponibilidad, reservas y lista de trabajadores
  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");
        const [availabilityData, reservationData, workerData] = await Promise.all([
          getAvailability(isWorker && user ? user.id : undefined),
          isWorker ? getWorkerReservations() : Promise.resolve([]),
          canPickWorker ? getWorkers() : Promise.resolve([]),
        ]);
        if (!ignore) {
          setAvailability(availabilityData);
          if (isWorker)      setReservations(reservationData);
          if (canPickWorker) setWorkers(workerData);
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialData();
    return () => { ignore = true; };
  }, [canPickWorker, isWorker, user]);

  // Cuando el admin selecciona otro trabajador, recarga su disponibilidad
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

  // Cuando se selecciona un cliente, carga solo sus equipos
  useEffect(() => {
    if (!selectedClientId) {
      setDevices([]);
      return;
    }
    let ignore = false;

    async function loadClientDevices() {
      try {
        const data = await getDevices(selectedClientId);
        if (!ignore) setDevices(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadClientDevices();
    return () => { ignore = true; };
  }, [selectedClientId]);

  function updateAvailabilityForm(key: keyof AvailabilityFormState, value: string) {
    setAvailabilityForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateDeviceForm(key: keyof DeviceFormState, value: string) {
    setDeviceForm((prev) => ({ ...prev, [key]: value }));
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

  async function handleReservationStatus(id: number, status: ReservationStatus) {
    try {
      setError("");
      const updated = await updateReservationStatus(id, status);
      setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleSearchClients() {
    try {
      setError("");
      const data = await searchClients(clientSearch.trim());
      setClients(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function handleClientSelect(client: ClientSummary) {
    setSelectedClientId(client.id);
    setDeviceForm((prev) => ({ ...prev, clientId: String(client.id) }));
    setEditingDeviceId(null);
  }

  function startEditingDevice(device: Device) {
    setEditingDeviceId(device.id);
    setDeviceForm({
      clientId: String(device.clientId),
      brand: device.brand,
      model: device.model,
      serialNumber: device.serialNumber ?? "",
      deviceType: device.deviceType,
      description: device.description,
    });
  }

  function resetDeviceForm() {
    setEditingDeviceId(null);
    setDeviceForm({ ...emptyDeviceForm, clientId: selectedClientId ? String(selectedClientId) : "" });
  }

  function handleDevicePhotoAdded(deviceId: number, photo: DevicePhoto) {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId ? { ...d, photos: [photo, ...(d.photos ?? [])] } : d,
      ),
    );
  }

  function handleDevicePhotoDeleted(deviceId: number, photoId: number) {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, photos: (d.photos ?? []).filter((p) => p.id !== photoId) }
          : d,
      ),
    );
  }

  async function handleSaveDevice() {
    try {
      setError("");
      setLoading(true);
      const payload: DevicePayload = {
        clientId: Number(deviceForm.clientId),
        brand: deviceForm.brand.trim(),
        model: deviceForm.model.trim(),
        serialNumber: deviceForm.serialNumber.trim() || undefined,
        deviceType: deviceForm.deviceType.trim(),
        description: deviceForm.description.trim(),
      };
      if (!payload.clientId || !payload.brand || !payload.model || !payload.deviceType || !payload.description) {
        throw new Error("Completa los datos del equipo");
      }
      if (editingDeviceId) {
        const updated = await updateDevice(editingDeviceId, payload);
        setDevices((prev) => prev.map((d) => (d.id === editingDeviceId ? updated : d)));
      } else {
        const created = await createDevice(payload);
        setDevices((prev) => [created, ...prev]);
      }
      resetDeviceForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return {
    // auth context
    isWorker,
    canPickWorker,
    // state
    workers,
    availability,
    reservations,
    clients,
    devices,
    selectedClientId,
    clientSearch,
    editingDeviceId,
    expandedDeviceId,
    error,
    loading,
    availabilityForm,
    deviceForm,
    selectedWorkerId,
    // setters
    setClientSearch,
    setExpandedDeviceId,
    // handlers
    updateAvailabilityForm,
    updateDeviceForm,
    handleCreateAvailability,
    handleToggleAvailability,
    handleDeleteAvailability,
    handleReservationStatus,
    handleSearchClients,
    handleClientSelect,
    startEditingDevice,
    resetDeviceForm,
    handleSaveDevice,
    handleDevicePhotoAdded,
    handleDevicePhotoDeleted,
  };
}
