import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../store/auth.store";
import { getAllReservations } from "../../services/reservations.service";
import { getWorkOrders } from "../../services/work-orders.service";
import { getWorkers } from "../../services/availability.service";
import type { Reservation, WorkOrder, Worker, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";

const IN_PROCESS = new Set<WorkOrderStatus>(["RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "IN_REPAIR"]);
const ACTIVE     = new Set<WorkOrderStatus>(["RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "IN_REPAIR", "READY"]);

const statusPill: Record<WorkOrderStatus, string> = {
  RECEIVED:      "pill-blue",
  DIAGNOSIS:     "pill-orange",
  WAITING_PARTS: "pill-orange",
  IN_REPAIR:     "pill-blue",
  READY:         "pill-success",
  DELIVERED:     "pill-success",
  CANCELLED:     "pill-muted",
};

function localDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(v);
}

function KpiCard({
  label,
  value,
  iconClass,
  icon,
  loading,
}: {
  label: string;
  value: string | number;
  iconClass: string;
  icon: string;
  loading: boolean;
}) {
  return (
    <div className="db-stat">
      <div className={`db-stat-icon ${iconClass}`}>{icon}</div>
      <div>
        <div className="db-stat-value">{loading ? "…" : value}</div>
        <p className="db-stat-label">{label}</p>
      </div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-muted, #6b7280)",
  marginBottom: "0.5rem",
  marginTop: "1.5rem",
  display: "block",
};

const tableHead: React.CSSProperties = {
  textAlign: "left",
  padding: "0.4rem 0.5rem",
  fontWeight: 600,
  fontSize: "0.8rem",
  borderBottom: "1px solid var(--border)",
  color: "var(--color-muted, #6b7280)",
};

const tableCell: React.CSSProperties = {
  padding: "0.5rem 0.5rem",
  borderBottom: "1px solid var(--border)",
  fontSize: "0.875rem",
};

export function AdminDashboard() {
  const auth = useAuth();
  const user = auth.user;
  const navigate = useNavigate();
  const firstName = user?.name.split(" ")[0] ?? "Administrador";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [workOrders,   setWorkOrders]   = useState<WorkOrder[]>([]);
  const [workers,      setWorkers]      = useState<Worker[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    async function load() {
      const [resRes, woRes, wkRes] = await Promise.allSettled([
        getAllReservations(),
        getWorkOrders(),
        getWorkers(),
      ]);
      if (resRes.status === "fulfilled") setReservations(resRes.value);
      if (woRes.status  === "fulfilled") setWorkOrders(woRes.value);
      if (wkRes.status  === "fulfilled") setWorkers(wkRes.value);
      setLoading(false);
    }
    void load();
  }, []);

  const today      = localDateStr();
  const monthStart = monthStartStr();

  // ── Reservas KPIs ──────────────────────────────────
  const reservasHoy  = useMemo(
    () => reservations.filter((r) => r.scheduledAt.slice(0, 10) === today).length,
    [reservations, today],
  );
  const pendientes = useMemo(
    () => reservations.filter((r) => r.status === "PENDING").length,
    [reservations],
  );
  const confirmadas = useMemo(
    () => reservations.filter((r) => r.status === "CONFIRMED").length,
    [reservations],
  );

  // ── Órdenes de trabajo KPIs ────────────────────────
  const ordenesActivas = useMemo(
    () => workOrders.filter((wo) => ACTIVE.has(wo.status)).length,
    [workOrders],
  );
  const enProceso = useMemo(
    () => workOrders.filter((wo) => IN_PROCESS.has(wo.status)).length,
    [workOrders],
  );
  const listas = useMemo(
    () => workOrders.filter((wo) => wo.status === "READY").length,
    [workOrders],
  );
  const entregadasMes = useMemo(
    () => workOrders.filter((wo) => wo.status === "DELIVERED" && wo.createdAt.slice(0, 10) >= monthStart).length,
    [workOrders, monthStart],
  );

  // ── Indicadores económicos ─────────────────────────
  const moObraPendiente = useMemo(
    () => workOrders.filter((wo) => ACTIVE.has(wo.status)).reduce((sum, wo) => sum + wo.laborCost, 0),
    [workOrders],
  );
  const moObraFacturada = useMemo(
    () => workOrders
      .filter((wo) => wo.status === "DELIVERED" && wo.createdAt.slice(0, 10) >= monthStart)
      .reduce((sum, wo) => sum + wo.laborCost, 0),
    [workOrders, monthStart],
  );

  // ── Carga de técnicos ──────────────────────────────
  const workerRows = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const wo of workOrders) {
      if (ACTIVE.has(wo.status)) {
        counts[wo.workerId] = (counts[wo.workerId] ?? 0) + 1;
      }
    }
    return workers
      .map((w) => ({ id: w.id, name: w.name, active: counts[w.id] ?? 0 }))
      .sort((a, b) => b.active - a.active);
  }, [workOrders, workers]);

  // ── Últimas 10 órdenes ─────────────────────────────
  const lastOrders = useMemo(
    () => [...workOrders].sort((a, b) => b.id - a.id).slice(0, 10),
    [workOrders],
  );

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel de administración</span>
        <h2>Bienvenido, {firstName}</h2>
        <p>Consola operativa del taller.</p>
      </div>

      {/* ── Reservas ── */}
      <span style={sectionLabel}>Reservas</span>
      <div className="db-stats" style={{ marginBottom: "0.5rem" }}>
        <KpiCard label="Hoy"         value={reservasHoy} iconClass="db-stat-icon-blue"   icon="📅" loading={loading} />
        <KpiCard label="Pendientes"  value={pendientes}  iconClass="db-stat-icon-orange" icon="🕐" loading={loading} />
        <KpiCard label="Confirmadas" value={confirmadas} iconClass="db-stat-icon-green"  icon="✅" loading={loading} />
      </div>

      {/* ── Órdenes de trabajo ── */}
      <span style={sectionLabel}>Órdenes de trabajo</span>
      <div className="db-stats" style={{ marginBottom: "0.5rem" }}>
        <KpiCard label="Órdenes activas"      value={ordenesActivas} iconClass="db-stat-icon-red"    icon="📋" loading={loading} />
        <KpiCard label="En proceso"           value={enProceso}      iconClass="db-stat-icon-blue"   icon="🔧" loading={loading} />
        <KpiCard label="Listas para entrega"  value={listas}         iconClass="db-stat-icon-green"  icon="📦" loading={loading} />
        <KpiCard label="Entregadas este mes"  value={entregadasMes}  iconClass="db-stat-icon-purple" icon="🚀" loading={loading} />
      </div>

      {/* ── Indicadores económicos ── */}
      <span style={sectionLabel}>Indicadores económicos</span>
      <div className="db-stats" style={{ marginBottom: "1.5rem" }}>
        <KpiCard label="Mano de obra pendiente"    value={formatCurrency(moObraPendiente)} iconClass="db-stat-icon-orange" icon="⏳" loading={loading} />
        <KpiCard label="Facturado este mes"        value={formatCurrency(moObraFacturada)} iconClass="db-stat-icon-green"  icon="💰" loading={loading} />
      </div>

      {/* ── Técnicos ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Carga de técnicos</h3>
          {!loading && (
            <span className="pill pill-muted db-pill-sm">{workerRows.length} técnico{workerRows.length === 1 ? "" : "s"}</span>
          )}
        </div>
        <div className="db-card-body">
          {loading ? (
            <div className="empty-state">Cargando…</div>
          ) : workerRows.length === 0 ? (
            <div className="empty-state">Sin técnicos registrados.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHead}>Técnico</th>
                  <th style={{ ...tableHead, textAlign: "right" }}>Órdenes activas</th>
                </tr>
              </thead>
              <tbody>
                {workerRows.map((row) => (
                  <tr key={row.id}>
                    <td style={tableCell}>{row.name}</td>
                    <td style={{ ...tableCell, textAlign: "right" }}>
                      <span className={`pill ${row.active > 0 ? "pill-blue" : "pill-muted"}`}>
                        {row.active}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Últimas órdenes ── */}
      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Últimas órdenes</h3>
          <span className="pill pill-muted db-pill-sm">10 recientes</span>
        </div>
        <div className="db-card-body">
          {loading ? (
            <div className="empty-state">Cargando…</div>
          ) : lastOrders.length === 0 ? (
            <div className="empty-state">No hay órdenes registradas.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={tableHead}>OT</th>
                  <th style={tableHead}>Cliente</th>
                  <th style={tableHead}>Equipo</th>
                  <th style={tableHead}>Estado</th>
                  <th style={tableHead}>Técnico</th>
                  <th style={tableHead} />
                </tr>
              </thead>
              <tbody>
                {lastOrders.map((wo) => (
                  <tr key={wo.id}>
                    <td style={tableCell}>#{wo.id}</td>
                    <td style={tableCell}>{wo.device?.client?.name ?? "—"}</td>
                    <td style={tableCell}>
                      {wo.device ? `${wo.device.brand} ${wo.device.model}` : "—"}
                    </td>
                    <td style={tableCell}>
                      <span className={`pill ${statusPill[wo.status]}`}>
                        {WORK_ORDER_STATUS_LABELS[wo.status]}
                      </span>
                    </td>
                    <td style={tableCell}>{wo.worker?.name ?? "—"}</td>
                    <td style={{ ...tableCell, textAlign: "right" }}>
                      <button
                        className="button button-secondary button-small"
                        onClick={() => navigate(`/work-orders/${wo.id}`)}
                        type="button"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
