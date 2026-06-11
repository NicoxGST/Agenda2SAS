/**
 * PROPUESTA TÉCNICA: "Mis Trabajos"
 *
 * Vista unificada para el WORKER que integra:
 *   Reserva → Cliente → Equipos → Orden de trabajo → Estado
 *
 * PREREQUISITOS para activación completa:
 *   1. Backend: GET /reservations/worker/my debe incluir workOrders con device
 *      embebidos en la respuesta (actualmente no los incluye).
 *   2. Backend: Eliminar @unique de WorkOrder.reservationId para permitir
 *      múltiples órdenes por visita (migración Prisma requerida).
 *   3. Opcional: tabla ReservationDevice para asociar equipos explícitamente
 *      a una visita antes de crear la orden.
 *
 * ENDPOINT esperado (futuro):
 *   GET /reservations/worker/my
 *   Response: Reservation & {
 *     client: { id, name, email, phone }
 *     service: { id, name }
 *     workOrders: Array<{
 *       id, status, problemDescription, diagnosis, laborCost
 *       device: { id, brand, model, deviceType }
 *     }>
 *   }
 */

import { useEffect, useState } from "react";

import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";
import type { Reservation } from "../../types";
import { RESERVATION_STATUS_LABELS, WORK_ORDER_STATUS_LABELS } from "../../types";
import { getWorkerReservations } from "../../services/reservations.service";

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function MyJobsPage() {
  const auth = useAuth();
  const user = auth.user;
  const isWorker = user?.role === ROLES.WORKER;

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isWorker) return;
    let ignore = false;

    async function loadJobs() {
      try {
        setError("");
        const data = await getWorkerReservations();
        if (!ignore) setReservations(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadJobs();
    return () => { ignore = true; };
  }, [isWorker]);

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
        <p>
          Vista unificada de reservas, clientes y órdenes de trabajo asignadas.
        </p>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {loading && (
        <div className="empty-state">Cargando trabajos...</div>
      )}

      {!loading && reservations.length === 0 && (
        <div className="empty-state">No tienes trabajos asignados.</div>
      )}

      <div className="list">
        {reservations.map((reservation) => (
          <JobCard key={reservation.id} reservation={reservation} />
        ))}
      </div>

      {/*
        TODO Sprint siguiente: cuando el backend devuelva workOrders embebidas en
        la reserva, reemplazar JobCard por una versión que muestre:
          - Cada equipo asociado a esta visita
          - El estado de la orden de trabajo por equipo
          - Botón "Crear orden" para equipos sin orden todavía
      */}
    </>
  );
}

type JobCardProps = {
  reservation: Reservation;
};

function JobCard({ reservation }: JobCardProps) {
  return (
    <article className="db-card db-card-mb">
      <div className="db-card-header">
        <div>
          <h3 className="db-card-title">
            Reserva #{reservation.id} — {reservation.client?.name ?? "Cliente"}
          </h3>
          <p className="item-description">
            {reservation.service?.name} · {formatDateTime(reservation.scheduledAt)}
          </p>
        </div>
        <span className="pill pill-blue">
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </span>
      </div>

      <div className="db-card-body">
        <div className="detail-grid">
          <p>
            <strong>Teléfono</strong>
            <span>{reservation.contactPhone}</span>
          </p>
          {reservation.clientNotes && (
            <p>
              <strong>Notas</strong>
              <span>{reservation.clientNotes}</span>
            </p>
          )}
        </div>

        {/*
          Sección de equipos — se activará cuando el backend incluya
          workOrders embebidas en la respuesta de reservas.

          Estructura esperada por equipo:
            [device.brand] [device.model] → [estado orden] | [+ Crear orden]

          Ejemplo visual:
            ┌─────────────────────────────────────────┐
            │ 💻 Laptop Lenovo    [EN REPARACIÓN]      │
            │ 🖥  PC Gamer        [DIAGNÓSTICO]         │
            │ 💻 MacBook Air      [+ Crear orden]      │
            └─────────────────────────────────────────┘
        */}
        <div className="empty-state section">
          <p>
            La vista de equipos y órdenes por visita estará disponible en el
            próximo sprint (requiere cambio en backend).
          </p>
        </div>
      </div>
    </article>
  );
}
