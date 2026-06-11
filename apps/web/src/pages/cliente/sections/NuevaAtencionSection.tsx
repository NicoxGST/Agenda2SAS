import { useState } from "react";

import type { AvailableSlot, Device, Service, Worker } from "../../../types";
import type {
  DeviceFormState,
  PhotoFormState,
  ReservationFormState,
} from "../hooks/useClientData";

type Tab = "reserva" | "equipo" | "foto";

type Props = {
  services: Service[];
  workers: Worker[];
  slots: AvailableSlot[];
  reservationForm: ReservationFormState;
  selectedWorker?: Worker;
  onReservationFormChange: (key: keyof ReservationFormState, value: string) => void;
  onCreateReservation: () => void;
  devices: Device[];
  deviceForm: DeviceFormState;
  onDeviceFormChange: (key: keyof DeviceFormState, value: string) => void;
  onCreateDevice: () => void;
  photoForm: PhotoFormState;
  onPhotoFormChange: (key: keyof PhotoFormState, value: string) => void;
  onCreatePhoto: () => void;
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
  devices,
  deviceForm,
  onDeviceFormChange,
  onCreateDevice,
  photoForm,
  onPhotoFormChange,
  onCreatePhoto,
  loading,
  error,
  success,
}: Props) {
  const [tab, setTab] = useState<Tab>("reserva");
  const canLoadSlots = !!(reservationForm.workerId && reservationForm.date);

  return (
    <div className="db-card db-card-mb">
      <div className="db-card-header">
        <h3 className="db-card-title">Nueva atención</h3>
      </div>

      <div className="db-card-body">
        <div className="actions">
          {(["reserva", "equipo", "foto"] as Tab[]).map((t) => (
            <button
              key={t}
              className={`button ${tab === t ? "button-primary" : "button-secondary"}`}
              onClick={() => setTab(t)}
              type="button"
            >
              {t === "reserva" && "Nueva reserva"}
              {t === "equipo" && "Registrar equipo"}
              {t === "foto"   && "Agregar foto"}
            </button>
          ))}
        </div>

        {error   && <p className="alert alert-error section">{error}</p>}
        {success && <p className="alert alert-success section">{success}</p>}

        {tab === "reserva" && (
          <div className="section">
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
        )}

        {tab === "equipo" && (
          <div className="section">
            <div className="form-grid">
              <label className="field">
                <span>Marca</span>
                <input
                  placeholder="Lenovo"
                  value={deviceForm.brand}
                  onChange={(e) => onDeviceFormChange("brand", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Modelo</span>
                <input
                  placeholder="IdeaPad 3"
                  value={deviceForm.model}
                  onChange={(e) => onDeviceFormChange("model", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Número de serie</span>
                <input
                  placeholder="Opcional"
                  value={deviceForm.serialNumber}
                  onChange={(e) => onDeviceFormChange("serialNumber", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Tipo de equipo</span>
                <input
                  placeholder="Notebook"
                  value={deviceForm.deviceType}
                  onChange={(e) => onDeviceFormChange("deviceType", e.target.value)}
                />
              </label>
              <label className="field">
                <span>Descripción del estado</span>
                <input
                  placeholder="Estado general del equipo"
                  value={deviceForm.description}
                  onChange={(e) => onDeviceFormChange("description", e.target.value)}
                />
              </label>
            </div>
            <div className="actions section">
              <button
                className="button button-primary"
                disabled={loading}
                onClick={onCreateDevice}
                type="button"
              >
                {loading ? "Creando…" : "Registrar equipo"}
              </button>
            </div>
          </div>
        )}

        {tab === "foto" && (
          <div className="section">
            {devices.length === 0 ? (
              <div className="empty-state">
                Registra un equipo primero para poder agregar fotos.
              </div>
            ) : (
              <>
                <div className="form-grid">
                  <label className="field">
                    <span>Equipo</span>
                    <select
                      value={photoForm.deviceId}
                      onChange={(e) => onPhotoFormChange("deviceId", e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.brand} {d.model}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>URL de la foto</span>
                    <input
                      placeholder="https://..."
                      value={photoForm.url}
                      onChange={(e) => onPhotoFormChange("url", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Descripción</span>
                    <input
                      placeholder="Pantalla rota"
                      value={photoForm.description}
                      onChange={(e) => onPhotoFormChange("description", e.target.value)}
                    />
                  </label>
                </div>
                <div className="actions section">
                  <button
                    className="button button-secondary"
                    disabled={loading}
                    onClick={onCreatePhoto}
                    type="button"
                  >
                    {loading ? "Agregando…" : "Agregar foto"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
