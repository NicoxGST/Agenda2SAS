import { BookingCalendar } from "../../../components/booking/BookingCalendar";
import type { AvailableSlot, Service, Worker } from "../../../types";
import type { ReservationFormState } from "../hooks/useClientData";

type Props = {
  services: Service[];
  workers: Worker[];
  slots: AvailableSlot[];
  availableDaysOfWeek: number[];
  availableDates: string[];
  reservationForm: ReservationFormState;
  selectedWorker?: Worker;
  loadingSlots: boolean;
  onReservationFormChange: (key: keyof ReservationFormState, value: string) => void;
  onCheckout: () => void;
  loading: boolean;
  error: string;
};

export function NuevaAtencionSection({
  services,
  workers,
  slots,
  availableDaysOfWeek,
  availableDates,
  reservationForm,
  selectedWorker,
  loadingSlots,
  onReservationFormChange,
  onCheckout,
  loading,
  error,
}: Props) {
  return (
    <div className="db-card db-card-mb">
      <div className="db-card-header">
        <h3 className="db-card-title">Nueva reserva</h3>
      </div>

      <div className="db-card-body">
        {error && <p className="alert alert-error">{error}</p>}

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
            <span>Teléfono</span>
            <input
              placeholder="+56 9 1234 5678"
              value={reservationForm.contactPhone}
              onChange={(e) => onReservationFormChange("contactPhone", e.target.value)}
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

        {reservationForm.workerId ? (
          <div className="section">
            {selectedWorker && (
              <p className="booking-cal-section-hint">
                Días disponibles de {selectedWorker.name}
              </p>
            )}
            <BookingCalendar
              availableDaysOfWeek={availableDaysOfWeek}
              availableDates={availableDates}
              loadingSlots={loadingSlots}
              selectedDate={reservationForm.date}
              selectedSlot={reservationForm.scheduledAt}
              slots={slots}
              onDateSelect={(date) => onReservationFormChange("date", date)}
              onSlotSelect={(scheduledAt) => onReservationFormChange("scheduledAt", scheduledAt)}
            />
          </div>
        ) : (
          <p className="item-meta section">
            Selecciona un técnico para ver el calendario de disponibilidad.
          </p>
        )}

        <div className="actions section">
          <button
            className="button button-primary"
            disabled={loading || !reservationForm.scheduledAt}
            onClick={onCheckout}
            type="button"
          >
            {loading ? "Redirigiendo…" : "Pagar abono — $100"}
          </button>
        </div>
      </div>
    </div>
  );
}
