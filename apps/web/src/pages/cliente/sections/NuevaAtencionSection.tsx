import type { AvailableSlot, Service, Worker } from "../../../types";
import type { ReservationFormState } from "../hooks/useClientData";

type Props = {
  services: Service[];
  workers: Worker[];
  slots: AvailableSlot[];
  reservationForm: ReservationFormState;
  selectedWorker?: Worker;
  onReservationFormChange: (key: keyof ReservationFormState, value: string) => void;
  onCreateReservation: () => void;
  loading: boolean;
  error: string;
  success: string;
};

export function NuevaAtencionSection({
  services,
  workers,
  slots,
  reservationForm,
  selectedWorker,
  onReservationFormChange,
  onCreateReservation,
  loading,
  error,
  success,
}: Props) {
  const canLoadSlots = !!(reservationForm.workerId && reservationForm.date);

  return (
    <div className="db-card db-card-mb">
      <div className="db-card-header">
        <h3 className="db-card-title">Nueva reserva</h3>
      </div>

      <div className="db-card-body">
        {error   && <p className="alert alert-error section">{error}</p>}
        {success && <p className="alert alert-success section">{success}</p>}

        <div className="form-grid">
          <label className="field">
            <span>Servicio</span>
            <select
              value={reservationForm.serviceId}
              onChange={(e) => onReservationFormChange("serviceId", e.target.value)}
            >
              <option value="">Seleccionar</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Técnico</span>
            <select
              value={reservationForm.workerId}
              onChange={(e) => onReservationFormChange("workerId", e.target.value)}
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
              value={reservationForm.date}
              onChange={(e) => onReservationFormChange("date", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Teléfono</span>
            <input
              placeholder="+56 9 1234 5678"
              value={reservationForm.contactPhone}
              onChange={(e) => onReservationFormChange("contactPhone", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Abono</span>
            <input
              min="0"
              type="number"
              value={reservationForm.depositAmount}
              onChange={(e) => onReservationFormChange("depositAmount", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Observaciones</span>
            <input
              placeholder="Ej: equipo no enciende"
              value={reservationForm.clientNotes}
              onChange={(e) => onReservationFormChange("clientNotes", e.target.value)}
            />
          </label>
        </div>

        <div className="slot-grid section">
          {slots.map((slot) => (
            <button
              className={
                reservationForm.scheduledAt === slot.scheduledAt
                  ? "button button-primary"
                  : "button button-secondary"
              }
              key={slot.scheduledAt}
              onClick={() => onReservationFormChange("scheduledAt", slot.scheduledAt)}
              type="button"
            >
              {slot.time}
            </button>
          ))}
          {canLoadSlots && slots.length === 0 && (
            <div className="empty-state">No hay horarios disponibles.</div>
          )}
        </div>

        {selectedWorker && (
          <p className="item-meta section">
            Técnico seleccionado: {selectedWorker.name}
          </p>
        )}

        <div className="actions section">
          <button
            className="button button-primary"
            disabled={loading}
            onClick={onCreateReservation}
            type="button"
          >
            {loading ? "Reservando…" : "Crear reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
