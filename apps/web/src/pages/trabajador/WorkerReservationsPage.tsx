import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";
import type { Reservation, ReservationStatus } from "../../types";
import { RESERVATION_STATUS_LABELS } from "../../types";
import {
  attendReservation,
  getWorkerReservations,
  updateReservation,
  updateReservationStatus,
} from "../../services/reservations.service";
import type { AttendReservationPayload } from "../../services/reservations.service";

type WorkOrderRef = { id: number; status: string };
type WorkerReservation = Reservation & { workOrders?: WorkOrderRef[] };

type EditFormState = {
  contactPhone: string;
  clientNotes: string;
  scheduledAt: string;
};

type ReceptionFormState = {
  brand: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  deviceDescription: string;
  problemDescription: string;
};

const emptyReceptionForm: ReceptionFormState = {
  brand: "",
  model: "",
  serialNumber: "",
  deviceType: "",
  deviceDescription: "",
  problemDescription: "",
};

const statusPill: Record<ReservationStatus, string> = {
  PENDING:   "pill-orange",
  CONFIRMED: "pill-blue",
  ATTENDED:  "pill-success",
  CANCELLED: "pill-muted",
  NO_SHOW:   "pill-muted",
};

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function WorkerReservationsPage() {
  const auth     = useAuth();
  const user     = auth.user;
  const isWorker = user?.role === ROLES.WORKER;
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<WorkerReservation[]>([]);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(true);
  const [actionId, setActionId]         = useState<number | null>(null);

  // Edit form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm]   = useState<EditFormState>({
    contactPhone: "",
    clientNotes: "",
    scheduledAt: "",
  });

  // Reception form state (Asistió flow)
  const [receptingId, setReceptingId]       = useState<number | null>(null);
  const [receptionForm, setReceptionForm]   = useState<ReceptionFormState>(emptyReceptionForm);
  const [receptionError, setReceptionError] = useState("");

  useEffect(() => {
    if (!isWorker) return;
    let ignore = false;

    async function load() {
      try {
        setError("");
        const data = (await getWorkerReservations()) as WorkerReservation[];
        if (!ignore) setReservations(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [isWorker]);

  const active = useMemo(
    () => reservations.filter((r) => r.status === "PENDING" || r.status === "CONFIRMED"),
    [reservations],
  );

  const closed = useMemo(
    () => reservations.filter((r) =>
      r.status === "ATTENDED" || r.status === "CANCELLED" || r.status === "NO_SHOW",
    ),
    [reservations],
  );

  async function handleStatus(id: number, status: ReservationStatus) {
    try {
      setActionId(id);
      setError("");
      const updated = (await updateReservationStatus(id, status)) as WorkerReservation;
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  function openReception(r: WorkerReservation) {
    setEditingId(null);
    setReceptionError("");
    setReceptionForm(emptyReceptionForm);
    setReceptingId(r.id);
  }

  function updateReceptionForm(key: keyof ReceptionFormState, value: string) {
    setReceptionForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAttend(reservationId: number) {
    const { brand, model, deviceType, problemDescription, serialNumber, deviceDescription } = receptionForm;

    if (!brand.trim() || !model.trim() || !deviceType.trim() || !problemDescription.trim()) {
      setReceptionError("Marca, modelo, tipo de equipo y descripción del problema son obligatorios.");
      return;
    }

    try {
      setActionId(reservationId);
      setReceptionError("");

      const payload: AttendReservationPayload = {
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || undefined,
        deviceType: deviceType.trim(),
        deviceDescription: deviceDescription.trim() || undefined,
        problemDescription: problemDescription.trim(),
      };

      const workOrder = await attendReservation(reservationId, payload);

      setReservations((prev) =>
        prev.map((r) => (r.id === reservationId ? { ...r, status: "ATTENDED" as ReservationStatus } : r)),
      );
      setReceptingId(null);

      navigate(`/work-orders/${workOrder.id}`);
    } catch (err: unknown) {
      setReceptionError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  function startEdit(r: WorkerReservation) {
    setReceptingId(null);
    setEditingId(r.id);
    setEditForm({
      contactPhone: r.contactPhone,
      clientNotes: r.clientNotes ?? "",
      scheduledAt: r.scheduledAt.slice(0, 16),
    });
  }

  function updateEditForm(key: keyof EditFormState, value: string) {
    setEditForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveEdit(id: number) {
    try {
      setActionId(id);
      setError("");
      const updated = (await updateReservation(id, {
        contactPhone: editForm.contactPhone || undefined,
        clientNotes: editForm.clientNotes || undefined,
        scheduledAt: editForm.scheduledAt || undefined,
      })) as WorkerReservation;
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditingId(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  }

  if (!isWorker) {
    return <div className="empty-state">Esta vista solo está disponible para trabajadores.</div>;
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel trabajador</span>
        <h2>Reservas</h2>
        <p>Gestiona las reservas antes de que entren al flujo técnico.</p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Reservas activas ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Reservas activas</h3>
          <span className="pill pill-muted db-pill-sm">
            {loading ? "…" : `${active.length} reserva${active.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="db-card-body">
          {loading && <div className="empty-state">Cargando reservas...</div>}

          {!loading && active.length === 0 && (
            <div className="empty-state">Sin reservas activas.</div>
          )}

          <div className="list">
            {active.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                actionId={actionId}
                editingId={editingId}
                editForm={editForm}
                receptingId={receptingId}
                receptionForm={receptionForm}
                receptionError={receptionError}
                onEditFormChange={updateEditForm}
                onReceptionFormChange={updateReceptionForm}
                onStatus={handleStatus}
                onStartEdit={startEdit}
                onCancelEdit={() => setEditingId(null)}
                onSaveEdit={handleSaveEdit}
                onOpenReception={openReception}
                onCancelReception={() => setReceptingId(null)}
                onAttend={handleAttend}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Historial ── */}
      {!loading && closed.length > 0 && (
        <div className="db-card db-card-mb">
          <div className="db-card-header">
            <h3 className="db-card-title">Historial de reservas</h3>
            <span className="pill pill-muted db-pill-sm">{closed.length}</span>
          </div>
          <div className="db-card-body">
            <div className="list">
              {closed.map((r) => (
                <article className="item-row" key={r.id}>
                  <div className="item-main">
                    <h3 className="item-title">#{r.id} — {r.client?.name ?? "Cliente"}</h3>
                    <p className="item-description">{r.service?.name ?? "Servicio"}</p>
                    <p className="item-meta">{formatDateTime(r.scheduledAt)}</p>
                  </div>
                  <div className="item-metrics">
                    <span className={`pill ${statusPill[r.status]}`}>
                      {RESERVATION_STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <div />
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

type ReservationCardProps = {
  reservation: WorkerReservation;
  actionId: number | null;
  editingId: number | null;
  editForm: EditFormState;
  receptingId: number | null;
  receptionForm: ReceptionFormState;
  receptionError: string;
  onEditFormChange: (key: keyof EditFormState, value: string) => void;
  onReceptionFormChange: (key: keyof ReceptionFormState, value: string) => void;
  onStatus: (id: number, status: ReservationStatus) => Promise<void>;
  onStartEdit: (r: WorkerReservation) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number) => Promise<void>;
  onOpenReception: (r: WorkerReservation) => void;
  onCancelReception: () => void;
  onAttend: (id: number) => Promise<void>;
};

function ReservationCard({
  reservation: r,
  actionId,
  editingId,
  editForm,
  receptingId,
  receptionForm,
  receptionError,
  onEditFormChange,
  onReceptionFormChange,
  onStatus,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onOpenReception,
  onCancelReception,
  onAttend,
}: ReservationCardProps) {
  const isActing    = actionId === r.id;
  const isEditing   = editingId === r.id;
  const isRecepting = receptingId === r.id;

  return (
    <div>
      <article className="item-row">
        <div className="item-main">
          <h3 className="item-title">
            Reserva #{r.id} — {r.client?.name ?? "Cliente"}
          </h3>
          <p className="item-description">{r.service?.name ?? "Servicio"}</p>
          <p className="item-meta">
            {formatDateTime(r.scheduledAt)}
            {r.contactPhone ? ` · ${r.contactPhone}` : ""}
          </p>
          {r.clientNotes && <p className="item-meta">{r.clientNotes}</p>}
        </div>

        <div className="item-metrics">
          <span className={`pill ${statusPill[r.status]}`}>
            {RESERVATION_STATUS_LABELS[r.status]}
          </span>
        </div>

        <div className="actions" style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {r.status === "PENDING" && (
            <>
              <button
                className="button button-primary button-small"
                disabled={isActing}
                onClick={() => onStatus(r.id, "CONFIRMED")}
                type="button"
              >
                Confirmar
              </button>
              <button
                className="button button-secondary button-small"
                disabled={isActing}
                onClick={() => onStatus(r.id, "CANCELLED")}
                type="button"
              >
                Cancelar
              </button>
            </>
          )}

          {r.status === "CONFIRMED" && (
            <>
              <button
                className={`button button-small ${isRecepting ? "button-primary" : "button-primary"}`}
                disabled={isActing || isEditing}
                onClick={() => isRecepting ? onCancelReception() : onOpenReception(r)}
                type="button"
              >
                {isRecepting ? "Cancelar recepción" : "Asistió →"}
              </button>
              <button
                className="button button-secondary button-small"
                disabled={isActing || isRecepting}
                onClick={() => onStatus(r.id, "NO_SHOW")}
                type="button"
              >
                No asistió
              </button>
              <button
                className="button button-secondary button-small"
                disabled={isActing || isRecepting}
                onClick={() => onStatus(r.id, "CANCELLED")}
                type="button"
              >
                Cancelar
              </button>
            </>
          )}

          {!isEditing && !isRecepting && (
            <button
              className="button button-secondary button-small"
              disabled={isActing}
              onClick={() => onStartEdit(r)}
              type="button"
            >
              Editar
            </button>
          )}
        </div>
      </article>

      {/* ── Formulario de recepción de equipo ── */}
      {isRecepting && (
        <div
          className="db-card"
          style={{
            marginTop: "-1px",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTop: "none",
          }}
        >
          <div className="db-card-header">
            <h3 className="db-card-title">Registrar equipo e iniciar orden</h3>
          </div>
          <div className="db-card-body">
            {receptionError && (
              <p className="alert alert-error" style={{ marginBottom: "1rem" }}>
                {receptionError}
              </p>
            )}

            <div className="form-grid">
              <label className="field">
                <span>Marca *</span>
                <input
                  placeholder="Apple, Samsung, HP…"
                  type="text"
                  value={receptionForm.brand}
                  onChange={(e) => onReceptionFormChange("brand", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Modelo *</span>
                <input
                  placeholder="iPhone 14, Galaxy S22…"
                  type="text"
                  value={receptionForm.model}
                  onChange={(e) => onReceptionFormChange("model", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Tipo de equipo *</span>
                <input
                  placeholder="Smartphone, Laptop, Tablet…"
                  type="text"
                  value={receptionForm.deviceType}
                  onChange={(e) => onReceptionFormChange("deviceType", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Número de serie</span>
                <input
                  placeholder="Opcional"
                  type="text"
                  value={receptionForm.serialNumber}
                  onChange={(e) => onReceptionFormChange("serialNumber", e.target.value)}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Descripción del equipo</span>
                <input
                  placeholder="Color, estado físico, accesorios incluidos…"
                  type="text"
                  value={receptionForm.deviceDescription}
                  onChange={(e) => onReceptionFormChange("deviceDescription", e.target.value)}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Problema reportado *</span>
                <textarea
                  placeholder="Describe el problema que reporta el cliente…"
                  rows={3}
                  value={receptionForm.problemDescription}
                  onChange={(e) => onReceptionFormChange("problemDescription", e.target.value)}
                />
              </label>
            </div>

            <div className="slot-grid" style={{ marginTop: "1rem" }}>
              <button
                className="button button-primary button-small"
                disabled={isActing}
                onClick={() => onAttend(r.id)}
                type="button"
              >
                {isActing ? "Creando orden…" : "Confirmar recepción y crear orden"}
              </button>
              <button
                className="button button-secondary button-small"
                disabled={isActing}
                onClick={onCancelReception}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulario de edición ── */}
      {isEditing && (
        <div
          className="db-card"
          style={{
            marginTop: "-1px",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderTop: "none",
          }}
        >
          <div className="db-card-body">
            <div className="form-grid">
              <label className="field">
                <span>Teléfono de contacto</span>
                <input
                  type="tel"
                  value={editForm.contactPhone}
                  onChange={(e) => onEditFormChange("contactPhone", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Fecha y hora</span>
                <input
                  type="datetime-local"
                  value={editForm.scheduledAt}
                  onChange={(e) => onEditFormChange("scheduledAt", e.target.value)}
                />
              </label>

              <label className="field" style={{ gridColumn: "1 / -1" }}>
                <span>Notas del cliente</span>
                <textarea
                  rows={2}
                  value={editForm.clientNotes}
                  onChange={(e) => onEditFormChange("clientNotes", e.target.value)}
                />
              </label>
            </div>

            <div className="slot-grid" style={{ marginTop: "0.75rem" }}>
              <button
                className="button button-primary button-small"
                disabled={isActing}
                onClick={() => onSaveEdit(r.id)}
                type="button"
              >
                Guardar
              </button>
              <button
                className="button button-secondary button-small"
                disabled={isActing}
                onClick={onCancelEdit}
                type="button"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
