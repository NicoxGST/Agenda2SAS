import { useEffect, useMemo, useState } from "react";

import type { Worker, AvailableSlot } from "../../services/availability.service";
import { getAvailableSlots, getWorkers } from "../../services/availability.service";
import type { Reservation } from "../../services/reservations.service";
import {
  createReservation,
  getMyReservations,
} from "../../services/reservations.service";
import type { Service } from "../../services/services.service";
import { getPublicServices } from "../../services/services.service";
import type { Device } from "../../services/devices.service";
import {
  createDevice,
  createDevicePhoto,
  deleteDevicePhoto,
  getMyDevices,
} from "../../services/devices.service";
import { DeviceDetails } from "../../components/devices/DeviceDetails";
import { WORK_ORDER_STATUS_LABELS } from "../../services/work-orders.service";

type FormState = {
  serviceId: string;
  workerId: string;
  date: string;
  scheduledAt: string;
  contactPhone: string;
  clientNotes: string;
  depositAmount: string;
};

const emptyForm: FormState = {
  serviceId: "",
  workerId: "",
  date: "",
  scheduledAt: "",
  contactPhone: "",
  clientNotes: "",
  depositAmount: "0",
};

type DeviceFormState = {
  brand: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  description: string;
};

const emptyDeviceForm: DeviceFormState = {
  brand: "",
  model: "",
  serialNumber: "",
  deviceType: "",
  description: "",
};

type PhotoFormState = {
  deviceId: string;
  url: string;
  description: string;
};

const emptyPhotoForm: PhotoFormState = {
  deviceId: "",
  url: "",
  description: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

export function ClientPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(emptyDeviceForm);
  const [photoForm, setPhotoForm] = useState<PhotoFormState>(emptyPhotoForm);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const canLoadSlots = form.workerId && form.date;

  const selectedWorker = useMemo(() => {
    return workers.find((worker) => worker.id === Number(form.workerId));
  }, [form.workerId, workers]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");

        const [serviceData, workerData, reservationData, deviceData] =
          await Promise.all([
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
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!canLoadSlots) {
        setSlots([]);
        return;
      }

      try {
        setError("");
        setForm((prev) => ({
          ...prev,
          scheduledAt: "",
        }));

        const data = await getAvailableSlots(Number(form.workerId), form.date);

        if (!ignore) {
          setSlots(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setSlots([]);
          setError(getErrorMessage(err));
        }
      }
    }

    void loadSlots();

    return () => {
      ignore = true;
    };
  }, [canLoadSlots, form.date, form.workerId]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateDeviceForm(key: keyof DeviceFormState, value: string) {
    setDeviceForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updatePhotoForm(key: keyof PhotoFormState, value: string) {
    setPhotoForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const payload = {
        serviceId: Number(form.serviceId),
        workerId: Number(form.workerId),
        scheduledAt: form.scheduledAt,
        contactPhone: form.contactPhone.trim(),
        clientNotes: form.clientNotes.trim() || undefined,
        depositAmount: Number(form.depositAmount),
      };

      if (
        !payload.serviceId ||
        !payload.workerId ||
        !payload.scheduledAt ||
        !payload.contactPhone ||
        payload.depositAmount < 0
      ) {
        throw new Error("Completa los datos de la reserva");
      }

      const created = await createReservation(payload);

      setReservations((prev) => [created, ...prev]);
      setForm(emptyForm);
      setSlots([]);
      setSuccess("Reserva creada correctamente");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDevice() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const payload = {
        brand: deviceForm.brand.trim(),
        model: deviceForm.model.trim(),
        serialNumber: deviceForm.serialNumber.trim() || undefined,
        deviceType: deviceForm.deviceType.trim(),
        description: deviceForm.description.trim(),
      };

      if (
        !payload.brand ||
        !payload.model ||
        !payload.deviceType ||
        !payload.description
      ) {
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
      const payload = {
        url: photoForm.url.trim(),
        description: photoForm.description.trim() || undefined,
      };

      if (!deviceId || !payload.url) {
        throw new Error("Selecciona un equipo e ingresa una URL");
      }

      const created = await createDevicePhoto(deviceId, payload);

      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId
            ? {
                ...device,
                photos: [created, ...(device.photos ?? [])],
              }
            : device,
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
        prev.map((device) =>
          device.id === deviceId
            ? {
                ...device,
                photos: (device.photos ?? []).filter((photo) => photo.id !== photoId),
              }
            : device,
        ),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function handleDevicePhotoAdded(
    deviceId: number,
    photo: NonNullable<Device["photos"]>[number],
  ) {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              photos: [photo, ...(device.photos ?? [])],
            }
          : device,
      ),
    );
  }

  function handleDevicePhotoDeleted(deviceId: number, photoId: number) {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId
          ? {
              ...device,
              photos: (device.photos ?? []).filter((photo) => photo.id !== photoId),
            }
          : device,
      ),
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Portal cliente</p>
          <h1>Reservar atencion</h1>
          <p className="page-copy">
            Selecciona un servicio, trabajador y horario disponible para crear
            una cita.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Nueva reserva</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            <label className="field">
              <span>Servicio</span>
              <select
                value={form.serviceId}
                onChange={(e) => updateForm("serviceId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Trabajador</span>
              <select
                value={form.workerId}
                onChange={(e) => updateForm("workerId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Telefono</span>
              <input
                placeholder="+56 9 1234 5678"
                value={form.contactPhone}
                onChange={(e) => updateForm("contactPhone", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Abono</span>
              <input
                min="0"
                type="number"
                value={form.depositAmount}
                onChange={(e) => updateForm("depositAmount", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Observaciones</span>
              <input
                placeholder="Ej: equipo no enciende"
                value={form.clientNotes}
                onChange={(e) => updateForm("clientNotes", e.target.value)}
              />
            </label>
          </div>

          <div className="slot-grid section">
            {slots.map((slot) => (
              <button
                className={
                  form.scheduledAt === slot.scheduledAt
                    ? "button button-primary"
                    : "button button-secondary"
                }
                key={slot.scheduledAt}
                onClick={() => updateForm("scheduledAt", slot.scheduledAt)}
                type="button"
              >
                {slot.time}
              </button>
            ))}

            {canLoadSlots && slots.length === 0 && (
              <div className="empty-state">No hay horarios disponibles.</div>
            )}
          </div>

          <div className="actions section">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              Crear reserva
            </button>
          </div>

          {selectedWorker && (
            <p className="item-meta section">Trabajador seleccionado: {selectedWorker.name}</p>
          )}
          {error && <p className="alert alert-error">{error}</p>}
          {success && <p className="alert alert-success">{success}</p>}
        </div>
      </section>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Mis reservas</h2>
            <p className="page-copy">
              {reservations.length} cita{reservations.length === 1 ? "" : "s"}
              registrada{reservations.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="list">
          {reservations.length === 0 && (
            <div className="empty-state">Aun no tienes reservas.</div>
          )}

          {reservations.map((reservation) => (
            <article className="item-row" key={reservation.id}>
              <div className="item-main">
                <h3 className="item-title">{reservation.service?.name}</h3>
                <p className="item-description">
                  {formatDateTime(reservation.scheduledAt)} con{" "}
                  {reservation.worker?.name}
                </p>
              </div>

              <div className="item-metrics">
                <span className="pill pill-blue">${reservation.depositAmount}</span>
                <span className="pill pill-muted">{reservation.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Mis equipos</h2>
            <p className="page-copy">
              Registra tus equipos y revisa el historial tecnico asociado.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Nuevo equipo</h2>
          </div>

          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Marca</span>
                <input
                  placeholder="Lenovo"
                  value={deviceForm.brand}
                  onChange={(e) => updateDeviceForm("brand", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Modelo</span>
                <input
                  placeholder="IdeaPad 3"
                  value={deviceForm.model}
                  onChange={(e) => updateDeviceForm("model", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Serie</span>
                <input
                  placeholder="Opcional"
                  value={deviceForm.serialNumber}
                  onChange={(e) => updateDeviceForm("serialNumber", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Tipo</span>
                <input
                  placeholder="Notebook"
                  value={deviceForm.deviceType}
                  onChange={(e) => updateDeviceForm("deviceType", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Descripcion</span>
                <input
                  placeholder="Estado general del equipo"
                  value={deviceForm.description}
                  onChange={(e) => updateDeviceForm("description", e.target.value)}
                />
              </label>
            </div>

            <div className="actions section">
              <button
                className="button button-primary"
                disabled={loading}
                onClick={handleCreateDevice}
                type="button"
              >
                Crear equipo
              </button>
            </div>
          </div>
        </section>

        <section className="panel section">
          <div className="panel-header">
            <h2>Foto de equipo</h2>
          </div>

          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Equipo</span>
                <select
                  value={photoForm.deviceId}
                  onChange={(e) => updatePhotoForm("deviceId", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.brand} {device.model}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>URL</span>
                <input
                  placeholder="https://..."
                  value={photoForm.url}
                  onChange={(e) => updatePhotoForm("url", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Descripcion</span>
                <input
                  placeholder="Pantalla rota"
                  value={photoForm.description}
                  onChange={(e) => updatePhotoForm("description", e.target.value)}
                />
              </label>
            </div>

            <div className="actions section">
              <button
                className="button button-secondary"
                disabled={loading}
                onClick={handleCreatePhoto}
                type="button"
              >
                Agregar foto
              </button>
            </div>
          </div>
        </section>

        <div className="list section">
          {devices.length === 0 && (
            <div className="empty-state">Aun no tienes equipos registrados.</div>
          )}

          {devices.map((device) => (
            <article className="item-row item-row-wide" key={device.id}>
              <div className="item-main">
                <h3 className="item-title">
                  {device.brand} {device.model}
                </h3>
                <p className="item-description">
                  {device.deviceType} - {device.description}
                </p>
                {device.serialNumber && (
                  <p className="item-meta">Serie: {device.serialNumber}</p>
                )}

                <div className="photo-list">
                  {(device.photos ?? []).map((photo) => (
                    <div className="photo-chip" key={photo.id}>
                      <a href={photo.url} target="_blank" rel="noreferrer">
                        {photo.description || "Foto"}
                      </a>
                      <button
                        className="button button-danger button-small"
                        onClick={() => handleDeletePhoto(photo.id, device.id)}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="work-history">
                  {(device.workOrders ?? []).length === 0 && (
                    <p className="item-meta">Sin ordenes de trabajo registradas.</p>
                  )}

                  {(device.workOrders ?? []).map((order) => (
                    <p className="item-meta" key={order.id}>
                      Orden #{order.id} -{" "}
                      {WORK_ORDER_STATUS_LABELS[order.status as keyof typeof WORK_ORDER_STATUS_LABELS] ??
                        order.status}
                      : {order.problemDescription}
                    </p>
                  ))}
                </div>

                <div className="actions section">
                  <button
                    className="button button-primary"
                    onClick={() =>
                      setExpandedDeviceId((current) =>
                        current === device.id ? null : device.id,
                      )
                    }
                    type="button"
                  >
                    {expandedDeviceId === device.id ? "Contraer" : "Ver detalles"}
                  </button>
                </div>

                {expandedDeviceId === device.id && (
                  <DeviceDetails
                    deviceId={device.id}
                    onPhotoAdded={handleDevicePhotoAdded}
                    onPhotoDeleted={handleDevicePhotoDeleted}
                  />
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
