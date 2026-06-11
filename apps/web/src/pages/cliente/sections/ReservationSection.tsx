import type { Service, Worker, AvailableSlot, Reservation } from "../../../types";
import { RESERVATION_STATUS_LABELS } from "../../../types";
import type { ReservationFormState } from "../hooks/useClientData";

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

type Props = {
  services: Service[];
  workers: Worker[];
  slots: AvailableSlot[];
  form: ReservationFormState;
  reservations: Reservation[];
  loading: boolean;
  error: string;
  success: string;
  selectedWorker?: Worker;
  onFormChange: (key: keyof ReservationFormState, value: string) => void;
  onSubmit: () => void;
};

export function ReservationSection({
  services,
  workers,
  slots,
  form,
  reservations,
  loading,
  error,
  success,
  selectedWorker,
  onFormChange,
  onSubmit,
}: Props) {
  const canLoadSlots = !!(form.workerId && form.date);

  return (
    <>
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
                onChange={(e) => onFormChange("serviceId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Trabajador</span>
              <select
                value={form.workerId}
                onChange={(e) => onFormChange("workerId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => onFormChange("date", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Teléfono</span>
              <input
                placeholder="+56 9 1234 5678"
                value={form.contactPhone}
                onChange={(e) => onFormChange("contactPhone", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Abono</span>
              <input
                min="0"
                type="number"
                value={form.depositAmount}
                onChange={(e) => onFormChange("depositAmount", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Observaciones</span>
              <input
                placeholder="Ej: equipo no enciende"
                value={form.clientNotes}
                onChange={(e) => onFormChange("clientNotes", e.target.value)}
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
                onClick={() => onFormChange("scheduledAt", slot.scheduledAt)}
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
              onClick={onSubmit}
              type="button"
            >
              Crear reserva
            </button>
          </div>

          {selectedWorker && (
            <p className="item-meta section">
              Trabajador seleccionado: {selectedWorker.name}
            </p>
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
              {reservations.length} cita{reservations.length === 1 ? "" : "s"} registrada
              {reservations.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="list">
          {reservations.length === 0 && (
            <div className="empty-state">Aún no tienes reservas.</div>
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
                <span className="pill pill-muted">
                  {RESERVATION_STATUS_LABELS[reservation.status]}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
