import { useEffect, useState } from "react";

import type { Device, Worker, WorkOrder, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";
import { getDevices } from "../../services/devices.service";
import { getWorkers } from "../../services/availability.service";
import {
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
} from "../../services/work-orders.service";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";

type WorkOrderFormState = {
  deviceId: string;
  workerId: string;
  reservationId: string;
  problemDescription: string;
  diagnosis: string;
  laborCost: string;
};

const emptyForm: WorkOrderFormState = {
  deviceId: "",
  workerId: "",
  reservationId: "",
  problemDescription: "",
  diagnosis: "",
  laborCost: "0",
};

const allStatuses: WorkOrderStatus[] = [
  "RECEIVED", "DIAGNOSIS", "WAITING_PARTS",
  "IN_REPAIR", "READY", "DELIVERED", "CANCELLED",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

const statusPill: Record<WorkOrderStatus, string> = {
  RECEIVED:      "pill-blue",
  DIAGNOSIS:     "pill-orange",
  WAITING_PARTS: "pill-orange",
  IN_REPAIR:     "pill-blue",
  READY:         "pill-success",
  DELIVERED:     "pill-success",
  CANCELLED:     "pill-muted",
};

export function WorkOrdersPage() {
  const auth = useAuth();
  const user = auth.user;
  const canPickWorker = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [devices, setDevices]       = useState<Device[]>([]);
  const [workers, setWorkers]       = useState<Worker[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [form, setForm]             = useState<WorkOrderFormState>(emptyForm);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setError("");
        const [deviceData, workOrderData, workerData] = await Promise.all([
          getDevices(),
          getWorkOrders(),
          canPickWorker ? getWorkers() : Promise.resolve([]),
        ]);

        if (!ignore) {
          setDevices(deviceData);
          setWorkOrders(workOrderData);
          if (canPickWorker) setWorkers(workerData);
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void load();
    return () => { ignore = true; };
  }, [canPickWorker]);

  function updateForm(key: keyof WorkOrderFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCreate() {
    try {
      setError("");
      setLoading(true);

      const payload = {
        deviceId: Number(form.deviceId),
        workerId: form.workerId ? Number(form.workerId) : undefined,
        reservationId: form.reservationId ? Number(form.reservationId) : undefined,
        problemDescription: form.problemDescription.trim(),
        diagnosis: form.diagnosis.trim() || undefined,
        laborCost: Number(form.laborCost),
      };

      if (!payload.deviceId || !payload.problemDescription || payload.laborCost < 0) {
        throw new Error("Completa los datos de la orden");
      }

      const created = await createWorkOrder(payload);
      setWorkOrders((prev) => [created, ...prev]);
      setForm(emptyForm);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id: number, status: WorkOrderStatus) {
    try {
      setError("");
      const updated = await updateWorkOrderStatus(id, status);
      setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? updated : wo)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Taller</span>
        <h2>Órdenes de trabajo</h2>
        <p>
          Crea órdenes desde un equipo registrado y actualiza el estado de
          reparación en cada etapa.
        </p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Formulario nueva orden ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Nueva orden de trabajo</h3>
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Equipo</span>
              <select
                value={form.deviceId}
                onChange={(e) => updateForm("deviceId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.id} — {d.brand} {d.model}
                  </option>
                ))}
              </select>
            </label>

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
              <span>Reserva ID (opcional)</span>
              <input
                min="1"
                placeholder="Opcional"
                type="number"
                value={form.reservationId}
                onChange={(e) => updateForm("reservationId", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Costo mano de obra</span>
              <input
                min="0"
                type="number"
                value={form.laborCost}
                onChange={(e) => updateForm("laborCost", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Descripción del problema</span>
              <input
                placeholder="No enciende"
                value={form.problemDescription}
                onChange={(e) => updateForm("problemDescription", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Diagnóstico (opcional)</span>
              <input
                placeholder="Opcional"
                value={form.diagnosis}
                onChange={(e) => updateForm("diagnosis", e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleCreate}
              type="button"
            >
              {loading ? "Creando…" : "Crear orden"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Listado de órdenes ── */}
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Listado de órdenes</h3>
          <span className="pill pill-muted db-pill-sm">
            {workOrders.length} orden{workOrders.length === 1 ? "" : "es"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {workOrders.length === 0 && (
              <div className="empty-state">No hay órdenes de trabajo registradas.</div>
            )}

            {workOrders.map((wo) => (
              <article className="item-row item-row-wide" key={wo.id}>
                <div className="item-main">
                  <h3 className="item-title">Orden #{wo.id}</h3>
                  <p className="item-description">
                    {wo.device?.brand} {wo.device?.model} — {wo.problemDescription}
                  </p>
                  {wo.diagnosis && (
                    <p className="item-meta">Diagnóstico: {wo.diagnosis}</p>
                  )}
                  <p className="item-meta">
                    Mano de obra: {formatCurrency(wo.laborCost)} — {formatDate(wo.createdAt)}
                  </p>

                  <div className="actions actions-mt">
                    {allStatuses.map((status) => (
                      <button
                        className={`button button-small ${
                          wo.status === status ? "button-primary" : "button-secondary"
                        }`}
                        key={status}
                        onClick={() => handleUpdateStatus(wo.id, status)}
                        type="button"
                      >
                        {WORK_ORDER_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="item-metrics">
                  <span className={`pill ${statusPill[wo.status]}`}>
                    {WORK_ORDER_STATUS_LABELS[wo.status]}
                  </span>
                  <span className="pill pill-muted">
                    {formatCurrency(wo.laborCost)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
