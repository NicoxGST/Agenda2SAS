import { useEffect, useMemo, useState } from "react";

import type { Worker, WorkerAvailability } from "../../services/availability.service";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  getWorkers,
  updateAvailability,
} from "../../services/availability.service";
import type {
  Reservation,
  ReservationStatus,
} from "../../services/reservations.service";
import {
  getWorkerReservations,
  updateReservationStatus,
  RESERVATION_STATUS_LABELS,
} from "../../services/reservations.service";
import type { ClientSummary, Device } from "../../services/devices.service";
import {
  createDevice,
  getDevices,
  searchClients,
  updateDevice,
} from "../../services/devices.service";
import { WORK_ORDER_STATUS_LABELS } from "../../services/work-orders.service";
import { ROLES } from "../../constants/roles";
import { DeviceDetails } from "../../components/devices/DeviceDetails";
import { useAuth } from "../../store/auth.store";

type FormState = {
  workerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: string;
};

const emptyForm: FormState = {
  workerId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: "60",
};

const dayLabels = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

const nextStatuses: ReservationStatus[] = [
  "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW",
];


type DeviceFormState = {
  clientId: string;
  brand: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  description: string;
};

const emptyDeviceForm: DeviceFormState = {
  clientId: "", brand: "", model: "",
  serialNumber: "", deviceType: "", description: "",
};


function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function WorkerPage() {
  const auth = useAuth();
  const user = auth.user;
  const isWorker      = user?.role === ROLES.WORKER;
  const canPickWorker = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [workers, setWorkers]           = useState<Worker[]>([]);
  const [availability, setAvailability] = useState<WorkerAvailability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients]           = useState<ClientSummary[]>([]);
  const [devices, setDevices]           = useState<Device[]>([]);


  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    workerId: isWorker && user ? String(user.id) : "",
  }));
  const [deviceForm, setDeviceForm]         = useState<DeviceFormState>(emptyDeviceForm);

  const [clientSearch, setClientSearch]     = useState("");
  const [editingDeviceId, setEditingDeviceId]   = useState<number | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const selectedWorkerId = useMemo(
    () => Number(form.workerId || user?.id || 0),
    [form.workerId, user?.id],
  );

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

        const deviceData = await getDevices();

        if (!ignore) {
          setAvailability(availabilityData);
          setDevices(deviceData);
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

  useEffect(() => {
    let ignore = false;

    async function loadSelectedWorkerAvailability() {
      if (!canPickWorker || !selectedWorkerId) return;
      try {
        const data = await getAvailability(selectedWorkerId);
        if (!ignore) setAvailability(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadSelectedWorkerAvailability();
    return () => { ignore = true; };
  }, [canPickWorker, selectedWorkerId]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }
  function updateDeviceForm(key: keyof DeviceFormState, value: string) {
    setDeviceForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreateAvailability() {
    try {
      setError("");
      setLoading(true);

      const payload = {
        workerId: selectedWorkerId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotMinutes: Number(form.slotMinutes),
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

  async function handleToggle(item: WorkerAvailability) {
    try {
      setError("");
      const updated = await updateAvailability(item.id, { isActive: !item.isActive });
      setAvailability((prev) =>
        prev.map((a) => (a.id === item.id ? updated : a)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");
      await deleteAvailability(id);
      setAvailability((prev) => prev.filter((a) => a.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleStatus(id: number, status: ReservationStatus) {
    try {
      setError("");
      const updated = await updateReservationStatus(id, status);
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? updated : r)),
      );
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
    setDeviceForm(emptyDeviceForm);
  }

  function handleDevicePhotoAdded(
    deviceId: number,
    photo: NonNullable<Device["photos"]>[number],
  ) {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === deviceId
          ? { ...d, photos: [photo, ...(d.photos ?? [])] }
          : d,
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

      const payload = {
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
        setDevices((prev) =>
          prev.map((d) => (d.id === editingDeviceId ? updated : d)),
        );
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


  return (
    <>
      {/* ── Cabecera ── */}
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel trabajador</span>
        <h2>Agenda y reservas</h2>
        <p>
          Administra la disponibilidad semanal, confirma citas y gestiona
          equipos y órdenes de trabajo.
        </p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Disponibilidad: formulario ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Nueva disponibilidad</h3>
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            {canPickWorker && (
              <label className="field">
                <span>Trabajador</span>
                <select
                  value={form.workerId}
                  onChange={(e) => updateForm("workerId", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              <span>Día</span>
              <select
                value={form.dayOfWeek}
                onChange={(e) => updateForm("dayOfWeek", e.target.value)}
              >
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Inicio</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm("startTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Término</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm("endTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Minutos por bloque</span>
              <input
                min="15"
                step="15"
                type="number"
                value={form.slotMinutes}
                onChange={(e) => updateForm("slotMinutes", e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleCreateAvailability}
              type="button"
            >
              Agregar disponibilidad
            </button>
          </div>
        </div>
      </div>

      {/* ── Disponibilidad: listado ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Disponibilidad registrada</h3>
          <span className="pill pill-muted db-pill-sm">
            {availability.length} bloque{availability.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {availability.length === 0 && (
              <div className="empty-state">No hay disponibilidad registrada.</div>
            )}

            {availability.map((item) => (
              <article className="item-row" key={item.id}>
                <div className="item-main">
                  <h3 className="item-title">{dayLabels[item.dayOfWeek]}</h3>
                  <p className="item-description">
                    {item.startTime} – {item.endTime}, bloques de {item.slotMinutes} min
                  </p>
                </div>

                <div className="item-metrics">
                  <span className={`pill ${item.isActive ? "pill-success" : "pill-muted"}`}>
                    {item.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="actions">
                  <button
                    className={`button button-small ${item.isActive ? "button-warning" : "button-secondary"}`}
                    onClick={() => handleToggle(item)}
                    type="button"
                  >
                    {item.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    className="button button-danger button-small"
                    onClick={() => handleDelete(item.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reservas (solo worker) ── */}
      {isWorker && (
        <div className="db-card db-card-mb">
          <div className="db-card-header">
            <h3 className="db-card-title">Reservas asignadas</h3>
            <span className="pill pill-muted db-pill-sm">
              {reservations.length} cita{reservations.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="db-card-body">
            <div className="list">
              {reservations.length === 0 && (
                <div className="empty-state">No tienes reservas asignadas.</div>
              )}

              {reservations.map((reservation) => (
                <article className="item-row" key={reservation.id}>
                  <div className="item-main">
                    <h3 className="item-title">{reservation.client?.name}</h3>
                    <p className="item-description">
                      {reservation.service?.name} — {formatDateTime(reservation.scheduledAt)}
                    </p>
                    {reservation.clientNotes && (
                      <p className="item-meta">{reservation.clientNotes}</p>
                    )}
                  </div>

                  <div className="item-metrics">
                    <span className="pill pill-blue">
                      {RESERVATION_STATUS_LABELS[reservation.status]}
                    </span>
                    <span className="pill pill-muted">{reservation.contactPhone}</span>
                  </div>

                  <div className="actions">
                    {nextStatuses.map((status) => (
                      <button
                        className="button button-secondary button-small"
                        key={status}
                        onClick={() => handleStatus(reservation.id, status)}
                        type="button"
                      >
                        {RESERVATION_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Equipos: buscar cliente ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Buscar cliente</h3>
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre o email</span>
              <input
                placeholder="cliente@ejemplo.com"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-secondary"
              onClick={handleSearchClients}
              type="button"
            >
              Buscar
            </button>
          </div>

          {clients.length > 0 && (
            <div className="slot-grid slot-grid-mt">
              {clients.map((client) => (
                <button
                  className={
                    deviceForm.clientId === String(client.id)
                      ? "button button-primary"
                      : "button button-secondary"
                  }
                  key={client.id}
                  onClick={() => updateDeviceForm("clientId", String(client.id))}
                  type="button"
                >
                  {client.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Equipos: formulario ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">
            {editingDeviceId ? "Editar equipo" : "Nuevo equipo"}
          </h3>
          {editingDeviceId && (
            <button
              className="button button-ghost button-small"
              onClick={resetDeviceForm}
              type="button"
            >
              Cancelar
            </button>
          )}
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Cliente ID</span>
              <input
                min="1"
                type="number"
                value={deviceForm.clientId}
                onChange={(e) => updateDeviceForm("clientId", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Marca</span>
              <input
                placeholder="HP"
                value={deviceForm.brand}
                onChange={(e) => updateDeviceForm("brand", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Modelo</span>
              <input
                placeholder="Pavilion"
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
              <span>Descripción</span>
              <input
                placeholder="Estado al ingreso"
                value={deviceForm.description}
                onChange={(e) => updateDeviceForm("description", e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleSaveDevice}
              type="button"
            >
              {editingDeviceId ? "Guardar equipo" : "Crear equipo"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Equipos: listado ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Equipos registrados</h3>
          <span className="pill pill-muted db-pill-sm">
            {devices.length} equipo{devices.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {devices.length === 0 && (
              <div className="empty-state">No hay equipos registrados.</div>
            )}

            {devices.map((device) => (
              <article className="item-row item-row-wide" key={device.id}>
                <div className="item-main">
                  <h3 className="item-title">
                    {device.brand} {device.model}
                  </h3>
                  <p className="item-description">
                    Cliente: {device.client?.name ?? device.clientId} — {device.deviceType}
                  </p>
                  <p className="item-meta">{device.description}</p>

                  {device.workOrders && device.workOrders.length > 0 && (
                    <div className="section">
                      {device.workOrders.map((wo) => (
                        <p className="item-meta" key={wo.id}>
                          OT #{wo.id} — {WORK_ORDER_STATUS_LABELS[wo.status]} — {formatDateTime(wo.createdAt)}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="actions actions-mt">
                    <button
                      className="button button-secondary button-small"
                      onClick={() =>
                        setExpandedDeviceId((c) => (c === device.id ? null : device.id))
                      }
                      type="button"
                    >
                      {expandedDeviceId === device.id ? "Contraer" : "Ver detalles"}
                    </button>
                    <button
                      className="button button-ghost button-small"
                      onClick={() => startEditingDevice(device)}
                      type="button"
                    >
                      Editar
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

                <div className="item-metrics">
                  <span className="pill pill-muted">ID {device.id}</span>
                  {device.serialNumber && (
                    <span className="pill pill-blue">{device.serialNumber}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

    </>
  );
}
