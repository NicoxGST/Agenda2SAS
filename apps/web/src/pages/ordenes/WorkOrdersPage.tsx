import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { ClientSummary, Device, Worker, WorkOrder, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";
import { createDevice, getDevices, searchClients } from "../../services/devices.service";
import { getWorkers } from "../../services/availability.service";
import {
  createWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
  type WorkOrderFilters,
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

const emptyFilters: WorkOrderFilters = {
  status: "",
  workerId: undefined,
  from: "",
  to: "",
};

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
  const navigate = useNavigate();

  const [devices, setDevices]         = useState<Device[]>([]);
  const [workers, setWorkers]         = useState<Worker[]>([]);
  const [workOrders, setWorkOrders]   = useState<WorkOrder[]>([]);
  const [form, setForm]               = useState<WorkOrderFormState>(emptyForm);
  const [error, setError]             = useState("");
  const [creating, setCreating]       = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Filter form state (not yet applied)
  const [filterStatus,   setFilterStatus]   = useState("");
  const [filterWorkerId, setFilterWorkerId] = useState("");
  const [filterFrom,     setFilterFrom]     = useState("");
  const [filterTo,       setFilterTo]       = useState("");

  // New device form state
  const [deviceMode,          setDeviceMode]          = useState<"existing" | "new">("existing");
  const [newDeviceClientId,   setNewDeviceClientId]   = useState<number | null>(null);
  const [newDeviceClientName, setNewDeviceClientName] = useState("");
  const [clientSearch,        setClientSearch]        = useState("");
  const [clientResults,       setClientResults]       = useState<ClientSummary[]>([]);
  const [searchingClients,    setSearchingClients]    = useState(false);
  const [newDeviceBrand,      setNewDeviceBrand]      = useState("");
  const [newDeviceModel,      setNewDeviceModel]      = useState("");
  const [newDeviceType,       setNewDeviceType]       = useState("");
  const [newDeviceSerial,     setNewDeviceSerial]     = useState("");
  const [newDeviceDescription,setNewDeviceDescription]= useState("");

  // Load devices and workers once on mount
  useEffect(() => {
    let ignore = false;

    async function loadStatic() {
      try {
        setError("");
        const [deviceData, workerData] = await Promise.all([
          getDevices(),
          canPickWorker ? getWorkers() : Promise.resolve([]),
        ]);
        if (!ignore) {
          setDevices(deviceData);
          if (canPickWorker) setWorkers(workerData);
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadStatic();
    return () => { ignore = true; };
  }, [canPickWorker]);

  // Load orders on mount
  useEffect(() => {
    void fetchOrders({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Client search debounce
  useEffect(() => {
    if (clientSearch.length < 2) {
      setClientResults([]);
      setSearchingClients(false);
      return;
    }
    setSearchingClients(true);
    const timer = setTimeout(() => {
      searchClients(clientSearch)
        .then((data) => setClientResults(data))
        .catch(() => setClientResults([]))
        .finally(() => setSearchingClients(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch]);

  async function fetchOrders(filters: WorkOrderFilters) {
    try {
      setLoadingOrders(true);
      setError("");
      const clean: WorkOrderFilters = {};
      if (filters.status)   clean.status   = filters.status;
      if (filters.workerId) clean.workerId = filters.workerId;
      if (filters.from)     clean.from     = filters.from;
      if (filters.to)       clean.to       = filters.to;
      const data = await getWorkOrders(Object.keys(clean).length ? clean : undefined);
      setWorkOrders(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingOrders(false);
    }
  }

  function handleApplyFilters() {
    void fetchOrders({
      status:   filterStatus   || undefined,
      workerId: filterWorkerId ? Number(filterWorkerId) : undefined,
      from:     filterFrom     || undefined,
      to:       filterTo       || undefined,
    });
  }

  function handleClearFilters() {
    setFilterStatus("");
    setFilterWorkerId("");
    setFilterFrom("");
    setFilterTo("");
    void fetchOrders({});
  }

  function updateForm(key: keyof WorkOrderFormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetNewDeviceForm() {
    setNewDeviceClientId(null);
    setNewDeviceClientName("");
    setClientSearch("");
    setClientResults([]);
    setNewDeviceBrand("");
    setNewDeviceModel("");
    setNewDeviceType("");
    setNewDeviceSerial("");
    setNewDeviceDescription("");
  }

  async function handleCreate() {
    try {
      setError("");
      setCreating(true);

      let deviceId: number;

      if (deviceMode === "new") {
        if (!newDeviceClientId)           throw new Error("Selecciona un cliente");
        if (!newDeviceBrand.trim())       throw new Error("Ingresa la marca del equipo");
        if (!newDeviceModel.trim())       throw new Error("Ingresa el modelo del equipo");
        if (!newDeviceType.trim())        throw new Error("Ingresa el tipo de equipo");
        if (!newDeviceDescription.trim()) throw new Error("Ingresa una descripción del equipo");

        const device = await createDevice({
          clientId:     newDeviceClientId,
          brand:        newDeviceBrand.trim(),
          model:        newDeviceModel.trim(),
          deviceType:   newDeviceType.trim(),
          serialNumber: newDeviceSerial.trim() || undefined,
          description:  newDeviceDescription.trim(),
        });
        deviceId = device.id;
        setDevices((prev) => [...prev, device]);
      } else {
        deviceId = Number(form.deviceId);
        if (!deviceId) throw new Error("Selecciona un equipo");
      }

      if (!form.problemDescription.trim()) throw new Error("Describe el problema");
      if (Number(form.laborCost) < 0)      throw new Error("El costo no puede ser negativo");

      const created = await createWorkOrder({
        deviceId,
        workerId:           form.workerId     ? Number(form.workerId)     : undefined,
        reservationId:      form.reservationId? Number(form.reservationId): undefined,
        problemDescription: form.problemDescription.trim(),
        diagnosis:          form.diagnosis.trim() || undefined,
        laborCost:          Number(form.laborCost),
      });

      setWorkOrders((prev) => [created, ...prev]);
      setForm(emptyForm);
      if (deviceMode === "new") resetNewDeviceForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setCreating(false);
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

  const hasActiveFilters = filterStatus || filterWorkerId || filterFrom || filterTo;

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
            {/* ── Selector de modo ── */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <span>Tipo de ingreso</span>
              <div className="actions" style={{ marginTop: "0.25rem" }}>
                <button
                  className={`button button-small ${deviceMode === "existing" ? "button-primary" : "button-secondary"}`}
                  onClick={() => setDeviceMode("existing")}
                  type="button"
                >
                  Dispositivo existente
                </button>
                <button
                  className={`button button-small ${deviceMode === "new" ? "button-primary" : "button-secondary"}`}
                  onClick={() => setDeviceMode("new")}
                  type="button"
                >
                  Dispositivo nuevo
                </button>
              </div>
            </div>

            {/* ── Modo: dispositivo existente ── */}
            {deviceMode === "existing" && (
              <label className="field">
                <span>Equipo</span>
                <select
                  value={form.deviceId}
                  onChange={(e) => updateForm("deviceId", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id} — {d.brand} {d.model}{d.client?.name ? ` · ${d.client.name}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {/* ── Modo: dispositivo nuevo ── */}
            {deviceMode === "new" && (
              <>
                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <span>Cliente *</span>
                  {newDeviceClientId ? (
                    <div className="actions" style={{ marginTop: "0.25rem" }}>
                      <span className="pill pill-blue">{newDeviceClientName}</span>
                      <button
                        className="button button-secondary button-small"
                        onClick={() => {
                          setNewDeviceClientId(null);
                          setNewDeviceClientName("");
                          setClientSearch("");
                          setClientResults([]);
                        }}
                        type="button"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        placeholder="Buscar por nombre o email…"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                      />
                      {searchingClients && (
                        <p className="item-meta" style={{ marginTop: "0.25rem" }}>Buscando…</p>
                      )}
                      {!searchingClients && clientSearch.length >= 2 && clientResults.length === 0 && (
                        <p className="item-meta" style={{ marginTop: "0.25rem" }}>
                          Cliente no encontrado. Debe estar registrado en el sistema.
                        </p>
                      )}
                      {clientResults.length > 0 && (
                        <div style={{ marginTop: "0.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
                          {clientResults.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setNewDeviceClientId(c.id);
                                setNewDeviceClientName(c.name);
                                setClientSearch("");
                                setClientResults([]);
                              }}
                              style={{ display: "block", width: "100%", textAlign: "left", padding: "0.5rem 0.75rem", background: "none", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                              type="button"
                            >
                              <strong>{c.name}</strong>
                              <span style={{ marginLeft: "0.5rem", color: "var(--color-muted, #6b7280)" }}>{c.email}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <label className="field">
                  <span>Marca *</span>
                  <input
                    placeholder="Apple"
                    value={newDeviceBrand}
                    onChange={(e) => setNewDeviceBrand(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Modelo *</span>
                  <input
                    placeholder="iPhone 14"
                    value={newDeviceModel}
                    onChange={(e) => setNewDeviceModel(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Tipo de equipo *</span>
                  <input
                    placeholder="Smartphone"
                    value={newDeviceType}
                    onChange={(e) => setNewDeviceType(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Número de serie</span>
                  <input
                    placeholder="Opcional"
                    value={newDeviceSerial}
                    onChange={(e) => setNewDeviceSerial(e.target.value)}
                  />
                </label>

                <label className="field">
                  <span>Descripción del equipo *</span>
                  <input
                    placeholder="Pantalla rota, no carga…"
                    value={newDeviceDescription}
                    onChange={(e) => setNewDeviceDescription(e.target.value)}
                  />
                </label>
              </>
            )}

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
              disabled={creating}
              onClick={handleCreate}
              type="button"
            >
              {creating ? "Creando…" : "Crear orden"}
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

          {/* ── Filtros ── */}
          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <label className="field">
              <span>Estado</span>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{WORK_ORDER_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </label>

            {canPickWorker && (
              <label className="field">
                <span>Técnico</span>
                <select value={filterWorkerId} onChange={(e) => setFilterWorkerId(e.target.value)}>
                  <option value="">Todos</option>
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              <span>Desde</span>
              <input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Hasta</span>
              <input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
              />
            </label>
          </div>
          <div className="actions" style={{ marginBottom: "1rem" }}>
            <button
              className="button button-primary button-small"
              disabled={loadingOrders}
              onClick={handleApplyFilters}
              type="button"
            >
              {loadingOrders ? "Cargando…" : "Aplicar filtros"}
            </button>
            {hasActiveFilters && (
              <button
                className="button button-secondary button-small"
                onClick={handleClearFilters}
                type="button"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="list">
            {loadingOrders && (
              <div className="empty-state">Cargando órdenes...</div>
            )}

            {!loadingOrders && workOrders.length === 0 && (
              <div className="empty-state">No hay órdenes de trabajo registradas.</div>
            )}

            {!loadingOrders && workOrders.map((wo) => (
              <article className="item-row item-row-wide" key={wo.id}>
                <div className="item-main">
                  <h3 className="item-title">
                    OT #{wo.id}
                    {wo.device?.client?.name ? ` — ${wo.device.client.name}` : ""}
                  </h3>
                  <p className="item-description">
                    {wo.device?.brand} {wo.device?.model} — {wo.problemDescription}
                  </p>
                  {wo.worker?.name && (
                    <p className="item-meta">Técnico: {wo.worker.name}</p>
                  )}
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

                <div className="actions">
                  <button
                    className="button button-secondary button-small"
                    onClick={() => navigate(`/work-orders/${wo.id}`)}
                    type="button"
                  >
                    Ver detalle
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
