import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";
import type { WorkOrder, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";
import { getWorkOrders } from "../../services/work-orders.service";

const statusPill: Record<WorkOrderStatus, string> = {
  RECEIVED:      "pill-blue",
  DIAGNOSIS:     "pill-orange",
  WAITING_PARTS: "pill-orange",
  IN_REPAIR:     "pill-blue",
  READY:         "pill-success",
  DELIVERED:     "pill-success",
  CANCELLED:     "pill-muted",
};

type FilterTab = "ALL" | WorkOrderStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL",           label: "Todas" },
  { key: "DIAGNOSIS",     label: "Diagnóstico" },
  { key: "WAITING_PARTS", label: "Esperando piezas" },
  { key: "IN_REPAIR",     label: "En reparación" },
  { key: "READY",         label: "Listas" },
  { key: "DELIVERED",     label: "Entregadas" },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

export function MyJobsPage() {
  const auth = useAuth();
  const user = auth.user;
  const isWorker = user?.role === ROLES.WORKER;
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isWorker) return;
    let ignore = false;

    async function loadJobs() {
      try {
        setError("");
        const data = await getWorkOrders();
        if (!ignore) setWorkOrders(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadJobs();
    return () => { ignore = true; };
  }, [isWorker]);

  const summary = useMemo(() => ({
    active:       workOrders.filter((wo) => !["DELIVERED", "CANCELLED"].includes(wo.status)).length,
    waitingParts: workOrders.filter((wo) => wo.status === "WAITING_PARTS").length,
    inRepair:     workOrders.filter((wo) => wo.status === "IN_REPAIR").length,
    ready:        workOrders.filter((wo) => wo.status === "READY").length,
  }), [workOrders]);

  const filtered = useMemo(
    () => activeFilter === "ALL" ? workOrders : workOrders.filter((wo) => wo.status === activeFilter),
    [workOrders, activeFilter],
  );

  if (!isWorker) {
    return (
      <div className="empty-state">
        Esta vista solo está disponible para trabajadores.
      </div>
    );
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel trabajador</span>
        <h2>Mis trabajos</h2>
        <p>Centro operativo de órdenes de trabajo asignadas.</p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Resumen ── */}
      {!loading && (
        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon-blue">🔧</div>
            <div>
              <p className="db-stat-value">{summary.active}</p>
              <p className="db-stat-label">Órdenes activas</p>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon-orange">📦</div>
            <div>
              <p className="db-stat-value">{summary.waitingParts}</p>
              <p className="db-stat-label">Esperando piezas</p>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon-purple">⚙️</div>
            <div>
              <p className="db-stat-value">{summary.inRepair}</p>
              <p className="db-stat-label">En reparación</p>
            </div>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon db-stat-icon-green">✅</div>
            <div>
              <p className="db-stat-value">{summary.ready}</p>
              <p className="db-stat-label">Listas para entrega</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Órdenes de trabajo</h3>
          <span className="pill pill-muted db-pill-sm">
            {filtered.length} orden{filtered.length === 1 ? "" : "es"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="slot-grid" style={{ marginBottom: "1rem" }}>
            {FILTER_TABS.map(({ key, label }) => (
              <button
                className={`button button-small ${activeFilter === key ? "button-primary" : "button-secondary"}`}
                key={key}
                onClick={() => setActiveFilter(key)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>

          {loading && <div className="empty-state">Cargando trabajos...</div>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state">No hay órdenes para este filtro.</div>
          )}

          <div className="list">
            {filtered.map((wo) => (
              <WorkOrderCard
                key={wo.id}
                workOrder={wo}
                onClick={() => navigate(`/work-orders/${wo.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

type WorkOrderCardProps = {
  workOrder: WorkOrder;
  onClick: () => void;
};

export function WorkOrderCard({ workOrder, onClick }: WorkOrderCardProps) {
  const clientName  = workOrder.device?.client?.name ?? "Cliente";
  const deviceLabel = workOrder.device
    ? `${workOrder.device.brand} ${workOrder.device.model}`
    : "Equipo sin registrar";

  return (
    <article className="item-row item-row-wide" key={workOrder.id}>
      <div className="item-main">
        <h3 className="item-title">OT #{workOrder.id} — {clientName}</h3>
        <p className="item-description">{deviceLabel}</p>
        <p className="item-meta">{formatDate(workOrder.createdAt)}</p>
      </div>

      <div className="item-metrics">
        <span className={`pill ${statusPill[workOrder.status]}`}>
          {WORK_ORDER_STATUS_LABELS[workOrder.status]}
        </span>
      </div>

      <div className="actions">
        <button
          className="button button-secondary button-small"
          onClick={onClick}
          type="button"
        >
          Ver detalle
        </button>
      </div>
    </article>
  );
}
