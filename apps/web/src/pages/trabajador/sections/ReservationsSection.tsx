import type { Reservation, ReservationStatus } from "../../../types";
import { RESERVATION_STATUS_LABELS } from "../../../types";

const NEXT_STATUSES: ReservationStatus[] = [
  "CONFIRMED", "ATTENDED", "CANCELLED", "NO_SHOW",
];

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

type Props = {
  reservations: Reservation[];
  onStatusChange: (id: number, status: ReservationStatus) => void;
};

export function ReservationsSection({ reservations, onStatusChange }: Props) {
  return (
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
                {NEXT_STATUSES.map((status) => (
                  <button
                    className="button button-secondary button-small"
                    key={status}
                    onClick={() => onStatusChange(reservation.id, status)}
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
  );
}
