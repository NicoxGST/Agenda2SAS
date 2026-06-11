import type { Worker, WorkerAvailability } from "../../../types";
import type { AvailabilityFormState } from "../hooks/useWorkerData";

const DAY_LABELS = [
  "Domingo", "Lunes", "Martes", "Miércoles",
  "Jueves", "Viernes", "Sábado",
];

type Props = {
  workers: Worker[];
  canPickWorker: boolean;
  availability: WorkerAvailability[];
  form: AvailabilityFormState;
  loading: boolean;
  onFormChange: (key: keyof AvailabilityFormState, value: string) => void;
  onCreate: () => void;
  onToggle: (item: WorkerAvailability) => void;
  onDelete: (id: number) => void;
};

export function AvailabilitySection({
  workers,
  canPickWorker,
  availability,
  form,
  loading,
  onFormChange,
  onCreate,
  onToggle,
  onDelete,
}: Props) {
  return (
    <>
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Nueva disponibilidad</h3>
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            {canPickWorker && (
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
            )}

            <label className="field">
              <span>Día</span>
              <select
                value={form.dayOfWeek}
                onChange={(e) => onFormChange("dayOfWeek", e.target.value)}
              >
                {DAY_LABELS.map((label, index) => (
                  <option key={label} value={index}>{label}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Inicio</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => onFormChange("startTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Término</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => onFormChange("endTime", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Minutos por bloque</span>
              <input
                min="15"
                step="15"
                type="number"
                value={form.slotMinutes}
                onChange={(e) => onFormChange("slotMinutes", e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={onCreate}
              type="button"
            >
              Agregar disponibilidad
            </button>
          </div>
        </div>
      </div>

      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Disponibilidad registrada</h3>
          <span className="pill pill-muted db-pill-sm">
            {availability.length} bloque{availability.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {availability.length === 0 && (
              <div className="empty-state">No hay disponibilidad registrada.</div>
            )}
            {availability.map((item) => (
              <article className="item-row" key={item.id}>
                <div className="item-main">
                  <h3 className="item-title">{DAY_LABELS[item.dayOfWeek]}</h3>
                  <p className="item-description">
                    {item.startTime} – {item.endTime}, bloques de {item.slotMinutes} min
                  </p>
                </div>
                <div className="item-metrics">
                  <span className={`pill ${item.isActive ? "pill-success" : "pill-muted"}`}>
                    {item.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <div className="actions">
                  <button
                    className={`button button-small ${item.isActive ? "button-warning" : "button-secondary"}`}
                    onClick={() => onToggle(item)}
                    type="button"
                  >
                    {item.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    className="button button-danger button-small"
                    onClick={() => onDelete(item.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
