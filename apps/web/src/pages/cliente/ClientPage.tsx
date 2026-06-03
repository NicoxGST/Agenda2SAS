import { useEffect, useMemo, useState } from "react";

import type { Worker, AvailableSlot } from "../../services/availability.service";
import { getAvailableSlots, getWorkers } from "../../services/availability.service";
import type { Reservation } from "../../services/reservations.service";
import {
  createReservation,
  getMyReservations,
} from "../../services/reservations.service";
import type { Service } from "../../services/services.service";
import { getPublicServices } from "../../services/services.service";

type FormState = {
  serviceId: string;
  workerId: string;
  date: string;
  scheduledAt: string;
  contactPhone: string;
  clientNotes: string;
  depositAmount: string;
};

const emptyForm: FormState = {
  serviceId: "",
  workerId: "",
  date: "",
  scheduledAt: "",
  contactPhone: "",
  clientNotes: "",
  depositAmount: "0",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

export function ClientPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const canLoadSlots = form.workerId && form.date;

  const selectedWorker = useMemo(() => {
    return workers.find((worker) => worker.id === Number(form.workerId));
  }, [form.workerId, workers]);

  useEffect(() => {
    let ignore = false;

    async function loadInitialData() {
      try {
        setError("");

        const [serviceData, workerData, reservationData] = await Promise.all([
          getPublicServices(),
          getWorkers(),
          getMyReservations(),
        ]);

        if (!ignore) {
          setServices(serviceData);
          setWorkers(workerData);
          setReservations(reservationData);
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
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!canLoadSlots) {
        setSlots([]);
        return;
      }

      try {
        setError("");
        setForm((prev) => ({
          ...prev,
          scheduledAt: "",
        }));

        const data = await getAvailableSlots(Number(form.workerId), form.date);

        if (!ignore) {
          setSlots(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setSlots([]);
          setError(getErrorMessage(err));
        }
      }
    }

    void loadSlots();

    return () => {
      ignore = true;
    };
  }, [canLoadSlots, form.date, form.workerId]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const payload = {
        serviceId: Number(form.serviceId),
        workerId: Number(form.workerId),
        scheduledAt: form.scheduledAt,
        contactPhone: form.contactPhone.trim(),
        clientNotes: form.clientNotes.trim() || undefined,
        depositAmount: Number(form.depositAmount),
      };

      if (
        !payload.serviceId ||
        !payload.workerId ||
        !payload.scheduledAt ||
        !payload.contactPhone ||
        payload.depositAmount < 0
      ) {
        throw new Error("Completa los datos de la reserva");
      }

      const created = await createReservation(payload);

      setReservations((prev) => [created, ...prev]);
      setForm(emptyForm);
      setSlots([]);
      setSuccess("Reserva creada correctamente");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Portal cliente</p>
          <h1>Reservar atencion</h1>
          <p className="page-copy">
            Selecciona un servicio, trabajador y horario disponible para crear
            una cita.
          </p>
        </div>
      </header>

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
                onChange={(e) => updateForm("serviceId", e.target.value)}
              >
                <option value="">Seleccionar</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>

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

            <label className="field">
              <span>Fecha</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateForm("date", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Telefono</span>
              <input
                placeholder="+56 9 1234 5678"
                value={form.contactPhone}
                onChange={(e) => updateForm("contactPhone", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Abono</span>
              <input
                min="0"
                type="number"
                value={form.depositAmount}
                onChange={(e) => updateForm("depositAmount", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Observaciones</span>
              <input
                placeholder="Ej: equipo no enciende"
                value={form.clientNotes}
                onChange={(e) => updateForm("clientNotes", e.target.value)}
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
                onClick={() => updateForm("scheduledAt", slot.scheduledAt)}
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
              onClick={handleSubmit}
              type="button"
            >
              Crear reserva
            </button>
          </div>

          {selectedWorker && (
            <p className="item-meta section">Trabajador seleccionado: {selectedWorker.name}</p>
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
              {reservations.length} cita{reservations.length === 1 ? "" : "s"}
              registrada{reservations.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="list">
          {reservations.length === 0 && (
            <div className="empty-state">Aun no tienes reservas.</div>
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
                <span className="pill pill-muted">{reservation.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
