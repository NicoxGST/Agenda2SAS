import { useEffect, useMemo, useState } from "react";

import type { Worker, WorkerAvailability } from "../../services/availability.service";
import {
  createAvailability,
  deleteAvailability,
  getAvailability,
  getWorkers,
  updateAvailability,
} from "../../services/availability.service";
import type {
  Reservation,
  ReservationStatus,
} from "../../services/reservations.service";
import {
  getWorkerReservations,
  updateReservationStatus,
} from "../../services/reservations.service";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";

type FormState = {
  workerId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotMinutes: string;
};

const emptyForm: FormState = {
  workerId: "",
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "18:00",
  slotMinutes: "60",
};

const dayLabels = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const nextStatuses: ReservationStatus[] = [
  "CONFIRMED",
  "ATTENDED",
  "CANCELLED",
  "NO_SHOW",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

export function WorkerPage() {
  const auth = useAuth();
  const user = auth.user;
  const isWorker = user?.role === ROLES.WORKER;
  const canPickWorker = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [availability, setAvailability] = useState<WorkerAvailability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    workerId: isWorker && user ? String(user.id) : "",
  }));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedWorkerId = useMemo(() => {
    return Number(form.workerId || user?.id || 0);
  }, [form.workerId, user?.id]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");

        const [availabilityData, reservationData, workerData] =
          await Promise.all([
            getAvailability(isWorker && user ? user.id : undefined),
            isWorker ? getWorkerReservations() : Promise.resolve([]),
            canPickWorker ? getWorkers() : Promise.resolve([]),
          ]);

        if (!ignore) {
          setAvailability(availabilityData);

          if (isWorker) {
            setReservations(reservationData);
          }

          if (canPickWorker) {
            setWorkers(workerData);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, [canPickWorker, isWorker, user]);

  useEffect(() => {
    let ignore = false;

    async function loadSelectedWorkerAvailability() {
      if (!canPickWorker || !selectedWorkerId) {
        return;
      }

      try {
        const data = await getAvailability(selectedWorkerId);

        if (!ignore) {
          setAvailability(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadSelectedWorkerAvailability();

    return () => {
      ignore = true;
    };
  }, [canPickWorker, selectedWorkerId]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleCreateAvailability() {
    try {
      setError("");
      setLoading(true);

      const payload = {
        workerId: selectedWorkerId,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        slotMinutes: Number(form.slotMinutes),
      };

      if (
        !payload.workerId ||
        payload.dayOfWeek < 0 ||
        !payload.startTime ||
        !payload.endTime ||
        payload.slotMinutes < 15
      ) {
        throw new Error("Completa la disponibilidad");
      }

      const created = await createAvailability(payload);

      setAvailability((prev) => [...prev, created]);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(item: WorkerAvailability) {
    try {
      setError("");

      const updated = await updateAvailability(item.id, {
        isActive: !item.isActive,
      });

      setAvailability((prev) =>
        prev.map((availabilityItem) =>
          availabilityItem.id === item.id ? updated : availabilityItem,
        ),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");

      await deleteAvailability(id);

      setAvailability((prev) => prev.filter((item) => item.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleStatus(id: number, status: ReservationStatus) {
    try {
      setError("");

      const updated = await updateReservationStatus(id, status);

      setReservations((prev) =>
        prev.map((reservation) => (reservation.id === id ? updated : reservation)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel trabajador</p>
          <h1>Agenda y reservas</h1>
          <p className="page-copy">
            Administra la disponibilidad semanal y confirma las citas asignadas.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Disponibilidad</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            {canPickWorker && (
              <label className="field">
                <span>Trabajador</span>
                <select
                  value={form.workerId}
                  onChange={(e) => updateForm("workerId", e.target.value)}
                >
                  <option value="">Seleccionar</option>
                  {workers.map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="field">
              <span>Dia</span>
              <select
                value={form.dayOfWeek}
                onChange={(e) => updateForm("dayOfWeek", e.target.value)}
              >
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Inicio</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => updateForm("startTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Termino</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => updateForm("endTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Minutos</span>
              <input
                min="15"
                step="15"
                type="number"
                value={form.slotMinutes}
                onChange={(e) => updateForm("slotMinutes", e.target.value)}
              />
            </label>
          </div>

          <div className="actions section">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleCreateAvailability}
              type="button"
            >
              Agregar disponibilidad
            </button>
          </div>

          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </section>

      <section className="section">
        <div className="list">
          {availability.length === 0 && (
            <div className="empty-state">No hay disponibilidad registrada.</div>
          )}

          {availability.map((item) => (
            <article className="item-row" key={item.id}>
              <div className="item-main">
                <h3 className="item-title">{dayLabels[item.dayOfWeek]}</h3>
                <p className="item-description">
                  {item.startTime} a {item.endTime}, bloques de{" "}
                  {item.slotMinutes} minutos
                </p>
              </div>

              <div className="item-metrics">
                <span className={item.isActive ? "pill pill-success" : "pill pill-muted"}>
                  {item.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="actions">
                <button
                  className="button button-warning"
                  onClick={() => handleToggle(item)}
                  type="button"
                >
                  {item.isActive ? "Desactivar" : "Activar"}
                </button>

                <button
                  className="button button-danger"
                  onClick={() => handleDelete(item.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isWorker && (
        <section className="section">
          <div className="page-header">
            <div>
              <h2>Reservas asignadas</h2>
              <p className="page-copy">Citas que pertenecen a tu agenda.</p>
            </div>
          </div>

          <div className="list">
            {reservations.length === 0 && (
              <div className="empty-state">No tienes reservas asignadas.</div>
            )}

            {reservations.map((reservation) => (
              <article className="item-row" key={reservation.id}>
                <div className="item-main">
                  <h3 className="item-title">{reservation.client?.name}</h3>
                  <p className="item-description">
                    {reservation.service?.name} -{" "}
                    {formatDateTime(reservation.scheduledAt)}
                  </p>
                  {reservation.clientNotes && (
                    <p className="item-meta">{reservation.clientNotes}</p>
                  )}
                </div>

                <div className="item-metrics">
                  <span className="pill pill-blue">{reservation.status}</span>
                  <span className="pill pill-muted">{reservation.contactPhone}</span>
                </div>

                <div className="actions">
                  {nextStatuses.map((status) => (
                    <button
                      className="button button-secondary"
                      key={status}
                      onClick={() => handleStatus(reservation.id, status)}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
