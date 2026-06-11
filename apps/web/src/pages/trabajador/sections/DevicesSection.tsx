import type { ClientSummary, Device, DevicePhoto } from "../../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../../types";
import { DeviceDetails } from "../../../components/devices/DeviceDetails";
import type { DeviceFormState } from "../hooks/useWorkerData";

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

type Props = {
  clients: ClientSummary[];
  devices: Device[];
  deviceForm: DeviceFormState;
  selectedClientId: number | null;
  editingDeviceId: number | null;
  expandedDeviceId: number | null;
  clientSearch: string;
  loading: boolean;
  onClientSearchChange: (value: string) => void;
  onSearch: () => void;
  onClientSelect: (client: ClientSummary) => void;
  onDeviceFormChange: (key: keyof DeviceFormState, value: string) => void;
  onSave: () => void;
  onStartEditing: (device: Device) => void;
  onResetForm: () => void;
  onExpandDevice: (id: number | null) => void;
  onPhotoAdded: (deviceId: number, photo: DevicePhoto) => void;
  onPhotoDeleted: (deviceId: number, photoId: number) => void;
};

export function DevicesSection({
  clients,
  devices,
  deviceForm,
  selectedClientId,
  editingDeviceId,
  expandedDeviceId,
  clientSearch,
  loading,
  onClientSearchChange,
  onSearch,
  onClientSelect,
  onDeviceFormChange,
  onSave,
  onStartEditing,
  onResetForm,
  onExpandDevice,
  onPhotoAdded,
  onPhotoDeleted,
}: Props) {
  return (
    <>
      {/* ── Buscar cliente ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Buscar cliente</h3>
          {selectedClientId && (
            <span className="pill pill-success db-pill-sm">Cliente seleccionado</span>
          )}
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre o email</span>
              <input
                placeholder="cliente@ejemplo.com"
                value={clientSearch}
                onChange={(e) => onClientSearchChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSearch(); }}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-secondary"
              onClick={onSearch}
              type="button"
            >
              Buscar
            </button>
          </div>

          {clients.length > 0 && (
            <div className="slot-grid slot-grid-mt">
              {clients.map((client) => (
                <button
                  className={
                    String(selectedClientId) === String(client.id)
                      ? "button button-primary"
                      : "button button-secondary"
                  }
                  key={client.id}
                  onClick={() => onClientSelect(client)}
                  type="button"
                >
                  {client.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Formulario de equipo ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">
            {editingDeviceId ? "Editar equipo" : "Nuevo equipo"}
          </h3>
          {editingDeviceId && (
            <button
              className="button button-ghost button-small"
              onClick={onResetForm}
              type="button"
            >
              Cancelar
            </button>
          )}
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Cliente ID</span>
              <input
                min="1"
                type="number"
                value={deviceForm.clientId}
                onChange={(e) => onDeviceFormChange("clientId", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Marca</span>
              <input
                placeholder="HP"
                value={deviceForm.brand}
                onChange={(e) => onDeviceFormChange("brand", e.target.value)}
              />
            </label>
            <label className="field">
              <span>Modelo</span>
              <input
                placeholder="Pavilion"
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
                placeholder="Estado al ingreso"
                value={deviceForm.description}
                onChange={(e) => onDeviceFormChange("description", e.target.value)}
              />
            </label>
          </div>

          <div className="actions actions-mt">
            <button
              className="button button-primary"
              disabled={loading || !deviceForm.clientId}
              onClick={onSave}
              type="button"
            >
              {editingDeviceId ? "Guardar equipo" : "Crear equipo"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Listado de equipos ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">
            {selectedClientId
              ? `Equipos del cliente #${selectedClientId}`
              : "Equipos"}
          </h3>
          <span className="pill pill-muted db-pill-sm">
            {devices.length} equipo{devices.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {!selectedClientId && (
              <div className="empty-state">
                Busca y selecciona un cliente para ver sus equipos.
              </div>
            )}

            {selectedClientId && devices.length === 0 && (
              <div className="empty-state">Este cliente no tiene equipos registrados.</div>
            )}

            {devices.map((device) => (
              <article className="item-row item-row-wide" key={device.id}>
                <div className="item-main">
                  <h3 className="item-title">
                    {device.brand} {device.model}
                  </h3>
                  <p className="item-description">
                    Cliente: {device.client?.name ?? device.clientId} — {device.deviceType}
                  </p>
                  <p className="item-meta">{device.description}</p>

                  {device.workOrders && device.workOrders.length > 0 && (
                    <div className="section">
                      {device.workOrders.map((wo) => (
                        <p className="item-meta" key={wo.id}>
                          OT #{wo.id} — {WORK_ORDER_STATUS_LABELS[wo.status]} —{" "}
                          {formatDateTime(wo.createdAt)}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="actions actions-mt">
                    <button
                      className="button button-secondary button-small"
                      onClick={() =>
                        onExpandDevice(expandedDeviceId === device.id ? null : device.id)
                      }
                      type="button"
                    >
                      {expandedDeviceId === device.id ? "Contraer" : "Ver detalles"}
                    </button>
                    <button
                      className="button button-ghost button-small"
                      onClick={() => onStartEditing(device)}
                      type="button"
                    >
                      Editar
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

                <div className="item-metrics">
                  <span className="pill pill-muted">ID {device.id}</span>
                  {device.serialNumber && (
                    <span className="pill pill-blue">{device.serialNumber}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
