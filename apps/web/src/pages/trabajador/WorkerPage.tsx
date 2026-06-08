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
} from "../../services/reservations.service";
import type { ClientSummary, Device } from "../../services/devices.service";
import {
  createDevice,
  getDevices,
  searchClients,
  updateDevice,
} from "../../services/devices.service";
import type {
  WorkOrder,
  WorkOrderStatus,
} from "../../services/work-orders.service";
import {
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
  WORK_ORDER_STATUS_LABELS,
} from "../../services/work-orders.service";
import {
  RESERVATION_STATUS_LABELS,
} from "../../services/reservations.service";
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
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const nextStatuses: ReservationStatus[] = [
  "CONFIRMED",
  "ATTENDED",
  "CANCELLED",
  "NO_SHOW",
];

const workOrderStatuses: WorkOrderStatus[] = [
  "RECEIVED",
  "DIAGNOSIS",
  "WAITING_PARTS",
  "IN_REPAIR",
  "READY",
  "DELIVERED",
  "CANCELLED",
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
  clientId: "",
  brand: "",
  model: "",
  serialNumber: "",
  deviceType: "",
  description: "",
};

type WorkOrderFormState = {
  deviceId: string;
  workerId: string;
  reservationId: string;
  problemDescription: string;
  diagnosis: string;
  laborCost: string;
};

const emptyWorkOrderForm: WorkOrderFormState = {
  deviceId: "",
  workerId: "",
  reservationId: "",
  problemDescription: "",
  diagnosis: "",
  laborCost: "0",
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
  const isWorker = user?.role === ROLES.WORKER;
  const canPickWorker = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [availability, setAvailability] = useState<WorkerAvailability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    workerId: isWorker && user ? String(user.id) : "",
  }));
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(emptyDeviceForm);
  const [workOrderForm, setWorkOrderForm] =
    useState<WorkOrderFormState>(emptyWorkOrderForm);
  const [clientSearch, setClientSearch] = useState("");
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [expandedDeviceId, setExpandedDeviceId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedWorkerId = useMemo(() => {
    return Number(form.workerId || user?.id || 0);
  }, [form.workerId, user?.id]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");

        const [availabilityData, reservationData, workerData] =
          await Promise.all([
            getAvailability(isWorker && user ? user.id : undefined),
            isWorker ? getWorkerReservations() : Promise.resolve([]),
            canPickWorker ? getWorkers() : Promise.resolve([]),
          ]);

        const [deviceData, workOrderData] = await Promise.all([
          getDevices(),
          getWorkOrders(),
        ]);

        if (!ignore) {
          setAvailability(availabilityData);
          setDevices(deviceData);
          setWorkOrders(workOrderData);

          if (isWorker) {
            setReservations(reservationData);
          }

          if (canPickWorker) {
            setWorkers(workerData);
          }
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
  }, [canPickWorker, isWorker, user]);

  useEffect(() => {
    let ignore = false;

    async function loadSelectedWorkerAvailability() {
      if (!canPickWorker || !selectedWorkerId) {
        return;
      }

      try {
        const data = await getAvailability(selectedWorkerId);

        if (!ignore) {
          setAvailability(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadSelectedWorkerAvailability();

    return () => {
      ignore = true;
    };
  }, [canPickWorker, selectedWorkerId]);

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

  function updateWorkOrderForm(key: keyof WorkOrderFormState, value: string) {
    setWorkOrderForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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

      if (
        !payload.workerId ||
        payload.dayOfWeek < 0 ||
        !payload.startTime ||
        !payload.endTime ||
        payload.slotMinutes < 15
      ) {
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

      const updated = await updateAvailability(item.id, {
        isActive: !item.isActive,
      });

      setAvailability((prev) =>
        prev.map((availabilityItem) =>
          availabilityItem.id === item.id ? updated : availabilityItem,
        ),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");

      await deleteAvailability(id);

      setAvailability((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleStatus(id: number, status: ReservationStatus) {
    try {
      setError("");

      const updated = await updateReservationStatus(id, status);

      setReservations((prev) =>
        prev.map((reservation) => (reservation.id === id ? updated : reservation)),
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

      if (
        !payload.clientId ||
        !payload.brand ||
        !payload.model ||
        !payload.deviceType ||
        !payload.description
      ) {
        throw new Error("Completa los datos del equipo");
      }

      if (editingDeviceId) {
        const updated = await updateDevice(editingDeviceId, payload);

        setDevices((prev) =>
          prev.map((device) => (device.id === editingDeviceId ? updated : device)),
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

  async function handleCreateWorkOrder() {
    try {
      setError("");
      setLoading(true);

      const payload = {
        deviceId: Number(workOrderForm.deviceId),
        workerId: workOrderForm.workerId ? Number(workOrderForm.workerId) : undefined,
        reservationId: workOrderForm.reservationId
          ? Number(workOrderForm.reservationId)
          : undefined,
        problemDescription: workOrderForm.problemDescription.trim(),
        diagnosis: workOrderForm.diagnosis.trim() || undefined,
        laborCost: Number(workOrderForm.laborCost),
      };

      if (!payload.deviceId || !payload.problemDescription || payload.laborCost < 0) {
        throw new Error("Completa los datos de la orden");
      }

      const created = await createWorkOrder(payload);

      setWorkOrders((prev) => [created, ...prev]);
      setDevices((prev) =>
        prev.map((device) =>
          device.id === created.deviceId
            ? {
                ...device,
                workOrders: [
                  {
                    id: created.id,
                    status: created.status,
                    problemDescription: created.problemDescription,
                    diagnosis: created.diagnosis,
                    laborCost: created.laborCost,
                    createdAt: created.createdAt,
                  },
                  ...(device.workOrders ?? []),
                ],
              }
            : device,
        ),
      );
      setWorkOrderForm(emptyWorkOrderForm);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkOrderStatus(id: number, status: WorkOrderStatus) {
    try {
      setError("");

      const updated = await updateWorkOrderStatus(id, status);

      setWorkOrders((prev) =>
        prev.map((workOrder) => (workOrder.id === id ? updated : workOrder)),
      );
      setDevices((prev) =>
        prev.map((device) => ({
          ...device,
          workOrders: device.workOrders?.map((workOrder) =>
            workOrder.id === id
              ? {
                  ...workOrder,
                  status: updated.status,
                }
              : workOrder,
          ),
        })),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel trabajador</p>
          <h1>Agenda y reservas</h1>
          <p className="page-copy">
            Administra la disponibilidad semanal y confirma las citas asignadas.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Disponibilidad</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            {canPickWorker && (
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
            )}

            <label className="field">
              <span>Dia</span>
              <select
                value={form.dayOfWeek}
                onChange={(e) => updateForm("dayOfWeek", e.target.value)}
              >
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
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
              <span>Termino</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm("endTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Minutos</span>
              <input
                min="15"
                step="15"
                type="number"
                value={form.slotMinutes}
                onChange={(e) => updateForm("slotMinutes", e.target.value)}
              />
            </label>
          </div>

          <div className="actions section">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleCreateAvailability}
              type="button"
            >
              Agregar disponibilidad
            </button>
          </div>

          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </section>

      <section className="section">
        <div className="list">
          {availability.length === 0 && (
            <div className="empty-state">No hay disponibilidad registrada.</div>
          )}

          {availability.map((item) => (
            <article className="item-row" key={item.id}>
              <div className="item-main">
                <h3 className="item-title">{dayLabels[item.dayOfWeek]}</h3>
                <p className="item-description">
                  {item.startTime} a {item.endTime}, bloques de{" "}
                  {item.slotMinutes} minutos
                </p>
              </div>

              <div className="item-metrics">
                <span className={item.isActive ? "pill pill-success" : "pill pill-muted"}>
                  {item.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="actions">
                <button
                  className="button button-warning"
                  onClick={() => handleToggle(item)}
                  type="button"
                >
                  {item.isActive ? "Desactivar" : "Activar"}
                </button>

                <button
                  className="button button-danger"
                  onClick={() => handleDelete(item.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isWorker && (
        <section className="section">
          <div className="page-header">
            <div>
              <h2>Reservas asignadas</h2>
              <p className="page-copy">Citas que pertenecen a tu agenda.</p>
            </div>
          </div>

          <div className="list">
            {reservations.length === 0 && (
              <div className="empty-state">No tienes reservas asignadas.</div>
            )}

            {reservations.map((reservation) => (
              <article className="item-row" key={reservation.id}>
                <div className="item-main">
                  <h3 className="item-title">{reservation.client?.name}</h3>
                  <p className="item-description">
                    {reservation.service?.name} -{" "}
                    {formatDateTime(reservation.scheduledAt)}
                  </p>
                  {reservation.clientNotes && (
                    <p className="item-meta">{reservation.clientNotes}</p>
                  )}
                </div>

                <div className="item-metrics">
                  <span className="pill pill-blue">{RESERVATION_STATUS_LABELS[reservation.status]}</span>
                  <span className="pill pill-muted">{reservation.contactPhone}</span>
                </div>

                <div className="actions">
                  {nextStatuses.map((status) => (
                  <button
                    className="button button-secondary"
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
        </section>
      )}

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Equipos</h2>
            <p className="page-copy">
              Busca un cliente, registra equipos y mantiene sus datos de ingreso.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Buscar cliente</h2>
          </div>

          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Nombre o email</span>
                <input
                  placeholder="client@test.com"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </label>
            </div>

            <div className="actions section">
              <button
                className="button button-secondary"
                onClick={handleSearchClients}
                type="button"
              >
                Buscar cliente
              </button>
            </div>

            <div className="slot-grid section">
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
          </div>
        </section>

        <section className="panel section">
          <div className="panel-header">
            <h2>{editingDeviceId ? "Editar equipo" : "Nuevo equipo"}</h2>
          </div>

          <div className="panel-body">
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
                <span>Descripcion</span>
                <input
                  placeholder="Estado al ingreso"
                  value={deviceForm.description}
                  onChange={(e) => updateDeviceForm("description", e.target.value)}
                />
              </label>
            </div>

            <div className="actions section">
              <button
                className="button button-primary"
                disabled={loading}
                onClick={handleSaveDevice}
                type="button"
              >
                {editingDeviceId ? "Guardar equipo" : "Crear equipo"}
              </button>

              {editingDeviceId && (
                <button
                  className="button button-ghost"
                  disabled={loading}
                  onClick={resetDeviceForm}
                  type="button"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="list section">
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
                  Cliente: {device.client?.name ?? device.clientId} -{" "}
                  {device.deviceType}
                </p>
                <p className="item-meta">{device.description}</p>
                {device.workOrders && device.workOrders.length > 0 && (
                  <div className="section">
                    {device.workOrders.map((workOrder) => (
                      <p className="item-meta" key={workOrder.id}>
                        OT #{workOrder.id} -{" "}
                        {WORK_ORDER_STATUS_LABELS[workOrder.status]} -{" "}
                        {formatDateTime(workOrder.createdAt)}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="item-metrics">
                <span className="pill pill-muted">ID {device.id}</span>
                {device.serialNumber && (
                  <span className="pill pill-blue">{device.serialNumber}</span>
                )}
              </div>

              <div className="actions">
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

                <button
                  className="button button-secondary"
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
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Ordenes de trabajo</h2>
            <p className="page-copy">
              Crea una orden desde un equipo y actualiza su estado de reparacion.
            </p>
          </div>
        </div>

        <section className="panel">
          <div className="panel-header">
            <h2>Nueva orden</h2>
          </div>

          <div className="panel-body">
            <div className="form-grid">
              <label className="field">
                <span>Equipo</span>
                <select
                  value={workOrderForm.deviceId}
                  onChange={(e) => updateWorkOrderForm("deviceId", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      #{device.id} {device.brand} {device.model}
                    </option>
                  ))}
                </select>
              </label>

              {canPickWorker && (
                <label className="field">
                  <span>Trabajador</span>
                  <select
                    value={workOrderForm.workerId}
                    onChange={(e) =>
                      updateWorkOrderForm("workerId", e.target.value)
                    }
                  >
                    <option value="">Seleccionar</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="field">
                <span>Reserva ID</span>
                <input
                  min="1"
                  placeholder="Opcional"
                  type="number"
                  value={workOrderForm.reservationId}
                  onChange={(e) =>
                    updateWorkOrderForm("reservationId", e.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>Costo mano de obra</span>
                <input
                  min="0"
                  type="number"
                  value={workOrderForm.laborCost}
                  onChange={(e) => updateWorkOrderForm("laborCost", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Problema</span>
                <input
                  placeholder="No enciende"
                  value={workOrderForm.problemDescription}
                  onChange={(e) =>
                    updateWorkOrderForm("problemDescription", e.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>Diagnostico</span>
                <input
                  placeholder="Opcional"
                  value={workOrderForm.diagnosis}
                  onChange={(e) => updateWorkOrderForm("diagnosis", e.target.value)}
                />
              </label>
            </div>

            <div className="actions section">
              <button
                className="button button-primary"
                disabled={loading}
                onClick={handleCreateWorkOrder}
                type="button"
              >
                Crear orden
              </button>
            </div>
          </div>
        </section>

        <div className="list section">
          {workOrders.length === 0 && (
            <div className="empty-state">No hay ordenes de trabajo.</div>
          )}

          {workOrders.map((workOrder) => (
            <article className="item-row item-row-wide" key={workOrder.id}>
              <div className="item-main">
                <h3 className="item-title">Orden #{workOrder.id}</h3>
                <p className="item-description">
                  {workOrder.device?.brand} {workOrder.device?.model} -{" "}
                  {workOrder.problemDescription}
                </p>
                {workOrder.diagnosis && (
                  <p className="item-meta">Diagnostico: {workOrder.diagnosis}</p>
                )}
                <p className="item-meta">
                  Costo mano de obra: {formatCurrency(workOrder.laborCost)}
                </p>
              </div>

              <div className="item-metrics">
                <span className="pill pill-blue">
                  {WORK_ORDER_STATUS_LABELS[workOrder.status]}
                </span>
                <span className="pill pill-muted">
                  {formatCurrency(workOrder.laborCost)}
                </span>
              </div>

              <div className="actions">
                {workOrderStatuses.map((status) => (
                  <button
                    className="button button-secondary"
                    key={status}
                    onClick={() => handleWorkOrderStatus(workOrder.id, status)}
                    type="button"
                  >
                    {WORK_ORDER_STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
