import type { Device, DevicePhoto, Reservation, WorkOrderStatus } from "../../../types";
import { RESERVATION_STATUS_LABELS, WORK_ORDER_STATUS_LABELS } from "../../../types";
import { DeviceDetails } from "../../../components/devices/DeviceDetails";

const statusPill: Record<WorkOrderStatus, string> = {
  RECEIVED:      "pill-blue",
  DIAGNOSIS:     "pill-orange",
  WAITING_PARTS: "pill-orange",
  IN_REPAIR:     "pill-blue",
  READY:         "pill-success",
  DELIVERED:     "pill-success",
  CANCELLED:     "pill-muted",
};

const activeStatuses = new Set<WorkOrderStatus>([
  "RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "IN_REPAIR", "READY",
]);

function formatDateTime(value: string) {
  return `${value.slice(0, 10)} ${value.slice(11, 16)}`;
}

type RepairCardProps = {
  device: Device;
  expanded: boolean;
  onToggle: () => void;
  onPhotoAdded: (deviceId: number, photo: DevicePhoto) => void;
  onPhotoDeleted: (deviceId: number, photoId: number) => void;
};

function RepairCard({
  device,
  expanded,
  onToggle,
  onPhotoAdded,
  onPhotoDeleted,
}: RepairCardProps) {
  const workOrders = device.workOrders ?? [];
  const activeOrders = workOrders.filter((wo) => activeStatuses.has(wo.status));
  const photoCount = device.photos?.length ?? 0;

  function headerPill() {
    if (activeOrders.length > 0) {
      return (
        <span className="pill pill-orange">
          {activeOrders.length} activa{activeOrders.length !== 1 ? "s" : ""}
        </span>
      );
    }
    if (workOrders.some((wo) => wo.status === "DELIVERED")) {
      return <span className="pill pill-success">Entregado</span>;
    }
    return <span className="pill pill-muted">Sin órdenes</span>;
  }

  return (
    <article className="db-card db-card-mb">
      <div className="db-card-header">
        <div>
          <h3 className="db-card-title">
            {device.brand} {device.model}
          </h3>
          <p className="item-description">
            {device.deviceType}
            {device.serialNumber ? ` · Serie ${device.serialNumber}` : ""}
          </p>
        </div>
        {headerPill()}
      </div>

      <div className="db-card-body">
        {activeOrders.length > 0 && (
          <div className="compact-list section">
            {activeOrders.map((wo) => (
              <div className="compact-row" key={wo.id}>
                <div>
                  <strong>OT #{wo.id}</strong>
                  <span>{wo.problemDescription}</span>
                  {wo.diagnosis && (
                    <span className="item-meta">Diagnóstico: {wo.diagnosis}</span>
                  )}
                </div>
                <span className={`pill ${statusPill[wo.status]}`}>
                  {WORK_ORDER_STATUS_LABELS[wo.status]}
                </span>
              </div>
            ))}
          </div>
        )}

        {workOrders.length === 0 && (
          <p className="item-meta section">
            Sin órdenes de trabajo. Cuando el técnico cree una orden aparecerá aquí.
          </p>
        )}

        {photoCount > 0 && (
          <p className="item-meta section">
            {photoCount} foto{photoCount !== 1 ? "s" : ""} registrada
            {photoCount !== 1 ? "s" : ""}
          </p>
        )}

        <div className="actions actions-mt">
          <button
            className="button button-secondary"
            onClick={onToggle}
            type="button"
          >
            {expanded ? "Contraer" : "Ver historial completo"}
          </button>
        </div>

        {expanded && (
          <div className="section">
            <DeviceDetails
              deviceId={device.id}
              onPhotoAdded={onPhotoAdded}
              onPhotoDeleted={onPhotoDeleted}
            />
          </div>
        )}
      </div>
    </article>
  );
}

type Props = {
  devices: Device[];
  reservations: Reservation[];
  expandedDeviceId: number | null;
  onExpandDevice: (id: number | null) => void;
  onPhotoAdded: (deviceId: number, photo: DevicePhoto) => void;
  onPhotoDeleted: (deviceId: number, photoId: number) => void;
};

export function MisReparacionesSection({
  devices,
  reservations,
  expandedDeviceId,
  onExpandDevice,
  onPhotoAdded,
  onPhotoDeleted,
}: Props) {
  return (
    <>
      <div className="db-card-header db-card-mb">
        <h3 className="db-card-title">Mis reparaciones</h3>
        <span className="pill pill-muted db-pill-sm">
          {devices.length} equipo{devices.length !== 1 ? "s" : ""}
        </span>
      </div>

      {devices.length === 0 && (
        <div className="empty-state db-card-mb">
          Aún no tienes equipos registrados. Usa "Nueva atención → Registrar equipo"
          para añadir tu primer equipo.
        </div>
      )}

      {devices.map((device) => (
        <RepairCard
          key={device.id}
          device={device}
          expanded={expandedDeviceId === device.id}
          onToggle={() =>
            onExpandDevice(expandedDeviceId === device.id ? null : device.id)
          }
          onPhotoAdded={onPhotoAdded}
          onPhotoDeleted={onPhotoDeleted}
        />
      ))}

      {reservations.length > 0 && (
        <div className="db-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Mis reservas</h3>
            <span className="pill pill-muted db-pill-sm">
              {reservations.length} reserva{reservations.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="db-card-body">
            <div className="compact-list">
              {reservations.map((r) => (
                <div className="compact-row" key={r.id}>
                  <div>
                    <strong>{r.service?.name ?? "Servicio"}</strong>
                    <span>
                      Con {r.worker?.name ?? "Técnico"} —{" "}
                      {formatDateTime(r.scheduledAt)}
                    </span>
                    {r.contactPhone && (
                      <span className="item-meta">{r.contactPhone}</span>
                    )}
                  </div>
                  <span className="pill pill-blue">
                    {RESERVATION_STATUS_LABELS[r.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
