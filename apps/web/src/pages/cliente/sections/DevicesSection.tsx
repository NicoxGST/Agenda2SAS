import type { Device, DevicePhoto } from "../../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../../types";
import { DeviceDetails } from "../../../components/devices/DeviceDetails";
import type { DeviceFormState, PhotoFormState } from "../hooks/useClientData";

type Props = {
  devices: Device[];
  deviceForm: DeviceFormState;
  photoForm: PhotoFormState;
  expandedDeviceId: number | null;
  loading: boolean;
  onDeviceFormChange: (key: keyof DeviceFormState, value: string) => void;
  onCreateDevice: () => void;
  onPhotoFormChange: (key: keyof PhotoFormState, value: string) => void;
  onCreatePhoto: () => void;
  onDeletePhoto: (photoId: number, deviceId: number) => void;
  onExpandDevice: (id: number | null) => void;
  onPhotoAdded: (deviceId: number, photo: DevicePhoto) => void;
  onPhotoDeleted: (deviceId: number, photoId: number) => void;
};

export function DevicesSection({
  devices,
  deviceForm,
  photoForm,
  expandedDeviceId,
  loading,
  onDeviceFormChange,
  onCreateDevice,
  onPhotoFormChange,
  onCreatePhoto,
  onDeletePhoto,
  onExpandDevice,
  onPhotoAdded,
  onPhotoDeleted,
}: Props) {
  return (
    <section className="section">
      <div className="page-header">
        <div>
          <h2>Mis equipos</h2>
          <p className="page-copy">
            Registra tus equipos y revisa el historial técnico asociado.
          </p>
        </div>
      </div>

      {/* ── Formulario nuevo equipo ── */}
      <section className="panel">
        <div className="panel-header">
          <h2>Nuevo equipo</h2>
        </div>
        <div className="panel-body">
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
              <span>Serie</span>
              <input
                placeholder="Opcional"
                value={deviceForm.serialNumber}
                onChange={(e) => onDeviceFormChange("serialNumber", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Tipo</span>
              <input
                placeholder="Notebook"
                value={deviceForm.deviceType}
                onChange={(e) => onDeviceFormChange("deviceType", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Descripción</span>
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
              Crear equipo
            </button>
          </div>
        </div>
      </section>

      {/* ── Formulario foto de equipo ── */}
      <section className="panel section">
        <div className="panel-header">
          <h2>Foto de equipo</h2>
        </div>
        <div className="panel-body">
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
              <span>URL</span>
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
              Agregar foto
            </button>
          </div>
        </div>
      </section>

      {/* ── Listado de equipos ── */}
      <div className="list section">
        {devices.length === 0 && (
          <div className="empty-state">Aún no tienes equipos registrados.</div>
        )}

        {devices.map((device) => (
          <article className="item-row item-row-wide" key={device.id}>
            <div className="item-main">
              <h3 className="item-title">
                {device.brand} {device.model}
              </h3>
              <p className="item-description">
                {device.deviceType} - {device.description}
              </p>
              {device.serialNumber && (
                <p className="item-meta">Serie: {device.serialNumber}</p>
              )}

              <div className="photo-list">
                {(device.photos ?? []).map((photo) => (
                  <div className="photo-chip" key={photo.id}>
                    <a href={photo.url} rel="noreferrer" target="_blank">
                      {photo.description || "Foto"}
                    </a>
                    <button
                      className="button button-danger button-small"
                      onClick={() => onDeletePhoto(photo.id, device.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className="work-history">
                {(device.workOrders ?? []).length === 0 && (
                  <p className="item-meta">Sin órdenes de trabajo registradas.</p>
                )}
                {(device.workOrders ?? []).map((order) => (
                  <p className="item-meta" key={order.id}>
                    Orden #{order.id} —{" "}
                    {WORK_ORDER_STATUS_LABELS[order.status] ?? order.status}:{" "}
                    {order.problemDescription}
                  </p>
                ))}
              </div>

              <div className="actions section">
                <button
                  className="button button-primary"
                  onClick={() =>
                    onExpandDevice(expandedDeviceId === device.id ? null : device.id)
                  }
                  type="button"
                >
                  {expandedDeviceId === device.id ? "Contraer" : "Ver detalles"}
                </button>
              </div>

              {expandedDeviceId === device.id && (
                <DeviceDetails
                  deviceId={device.id}
                  onPhotoAdded={onPhotoAdded}
                  onPhotoDeleted={onPhotoDeleted}
                />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
