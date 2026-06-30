import { useEffect, useMemo, useState } from "react";

import type {
  Worker,
  AvailableSlot,
  Service,
  Device,
  DevicePayload,
  DevicePhoto,
  DevicePhotoPayload,
  Reservation,
} from "../../../types";
import { getWorkers, getAvailableSlots, getWorkerSchedule } from "../../../services/availability.service";
import { getMyReservations } from "../../../services/reservations.service";
import { createCheckout } from "../../../services/payments.service";
import { getPublicServices } from "../../../services/services.service";
import {
  createDevice,
  createDevicePhoto,
  deleteDevicePhoto,
  getMyDevices,
} from "../../../services/devices.service";

export type ReservationFormState = {
  serviceId: string;
  workerId: string;
  date: string;
  scheduledAt: string;
  contactPhone: string;
  clientNotes: string;
};

export type DeviceFormState = {
  brand: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  description: string;
};

export type PhotoFormState = {
  deviceId: string;
  url: string;
  description: string;
};

const emptyReservationForm: ReservationFormState = {
  serviceId: "",
  workerId: "",
  date: "",
  scheduledAt: "",
  contactPhone: "",
  clientNotes: "",
};

const emptyDeviceForm: DeviceFormState = {
  brand: "", model: "", serialNumber: "", deviceType: "", description: "",
};

const emptyPhotoForm: PhotoFormState = {
  deviceId: "", url: "", description: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function useClientData() {
  const [services, setServices]     = useState<Service[]>([]);
  const [workers, setWorkers]       = useState<Worker[]>([]);
  const [slots, setSlots]           = useState<AvailableSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [devices, setDevices]       = useState<Device[]>([]);

  const [reservationForm, setReservationForm] = useState<ReservationFormState>(emptyReservationForm);
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(emptyDeviceForm);
  const [photoForm, setPhotoForm]   = useState<PhotoFormState>(emptyPhotoForm);

  const [availableDaysOfWeek, setAvailableDaysOfWeek] = useState<number[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const canLoadSlots = !!(reservationForm.workerId && reservationForm.date);

  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === Number(reservationForm.workerId)),
    [reservationForm.workerId, workers],
  );

  // Carga inicial: servicios, trabajadores, reservas y equipos propios
  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");
        const [serviceData, workerData, reservationData, deviceData] = await Promise.all([
          getPublicServices(),
          getWorkers(),
          getMyReservations(),
          getMyDevices(),
        ]);
        if (!ignore) {
          setServices(serviceData);
          setWorkers(workerData);
          setReservations(reservationData);
          setDevices(deviceData);
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialData();
    return () => { ignore = true; };
  }, []);

  // Carga la disponibilidad semanal del trabajador cuando cambia la selección
  useEffect(() => {
    let ignore = false;

    if (!reservationForm.workerId) {
      setAvailableDaysOfWeek([]);
      setAvailableDates([]);
      return;
    }

    getWorkerSchedule(Number(reservationForm.workerId))
      .then((data) => {
        if (ignore) return;
        const specific = data
          .filter((a) => a.specificDate)
          .map((a) => a.specificDate!.slice(0, 10));
        const recurring = data
          .filter((a) => !a.specificDate)
          .map((a) => a.dayOfWeek);
        setAvailableDates([...new Set(specific)]);
        setAvailableDaysOfWeek([...new Set(recurring)]);
      })
      .catch(() => {
        if (!ignore) { setAvailableDaysOfWeek([]); setAvailableDates([]); }
      });

    return () => { ignore = true; };
  }, [reservationForm.workerId]);

  // Carga slots disponibles cuando cambia trabajador o fecha
  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!canLoadSlots) {
        setSlots([]);
        return;
      }
      try {
        setLoadingSlots(true);
        setError("");
        setReservationForm((prev) => ({ ...prev, scheduledAt: "" }));
        const data = await getAvailableSlots(
          Number(reservationForm.workerId),
          reservationForm.date,
        );
        if (!ignore) setSlots(data);
      } catch (err: unknown) {
        if (!ignore) {
          setSlots([]);
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) setLoadingSlots(false);
      }
    }

    void loadSlots();
    return () => { ignore = true; };
  }, [canLoadSlots, reservationForm.date, reservationForm.workerId]);

  function updateReservationForm(key: keyof ReservationFormState, value: string) {
    setReservationForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "workerId" ? { date: "", scheduledAt: "" } : {}),
    }));
  }

  function updateDeviceForm(key: keyof DeviceFormState, value: string) {
    setDeviceForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhotoForm(key: keyof PhotoFormState, value: string) {
    setPhotoForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCheckout() {
    try {
      setError("");
      setLoading(true);
      const serviceId = Number(reservationForm.serviceId);
      const workerId  = Number(reservationForm.workerId);
      if (!serviceId || !workerId || !reservationForm.scheduledAt || !reservationForm.contactPhone.trim()) {
        throw new Error("Completa todos los datos antes de pagar");
      }
      const { initPoint, externalRef } = await createCheckout({
        serviceId,
        workerId,
        scheduledAt: reservationForm.scheduledAt,
        contactPhone: reservationForm.contactPhone.trim(),
        clientNotes: reservationForm.clientNotes.trim() || undefined,
      });
      sessionStorage.setItem('pendingPaymentRef', externalRef);
      window.location.href = initPoint;
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  }

  async function handleCreateDevice() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const payload: DevicePayload = {
        brand: deviceForm.brand.trim(),
        model: deviceForm.model.trim(),
        serialNumber: deviceForm.serialNumber.trim() || undefined,
        deviceType: deviceForm.deviceType.trim(),
        description: deviceForm.description.trim(),
      };
      if (!payload.brand || !payload.model || !payload.deviceType || !payload.description) {
        throw new Error("Completa los datos del equipo");
      }
      const created = await createDevice(payload);
      setDevices((prev) => [created, ...prev]);
      setDeviceForm(emptyDeviceForm);
      setSuccess("Equipo creado correctamente");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePhoto() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);
      const deviceId = Number(photoForm.deviceId);
      const payload: DevicePhotoPayload = {
        url: photoForm.url.trim(),
        description: photoForm.description.trim() || undefined,
      };
      if (!deviceId || !payload.url) {
        throw new Error("Selecciona un equipo e ingresa una URL");
      }
      const created = await createDevicePhoto(deviceId, payload);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, photos: [created, ...(d.photos ?? [])] } : d,
        ),
      );
      setPhotoForm(emptyPhotoForm);
      setSuccess("Foto agregada correctamente");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhoto(photoId: number, deviceId: number) {
    try {
      setError("");
      await deleteDevicePhoto(photoId);
      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId
            ? { ...d, photos: (d.photos ?? []).filter((p) => p.id !== photoId) }
            : d,
        ),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
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

  return {
    // state
    services,
    workers,
    slots,
    reservations,
    devices,
    reservationForm,
    deviceForm,
    photoForm,
    expandedDeviceId,
    error,
    success,
    loading,
    loadingSlots,
    canLoadSlots,
    availableDaysOfWeek,
    selectedWorker,
    availableDates,
    // setters
    setExpandedDeviceId,
    // handlers
    updateReservationForm,
    updateDeviceForm,
    updatePhotoForm,
    handleCheckout,
    handleCreateDevice,
    handleCreatePhoto,
    handleDeletePhoto,
    handleDevicePhotoAdded,
    handleDevicePhotoDeleted,
  };
}
