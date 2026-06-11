import { useEffect, useMemo, useState } from "react";

import {
  createDevicePhoto,
  deleteDevicePhoto,
  getDeviceDetails,
} from "../../services/devices.service";
import type {
  DeviceDetailsData,
  DevicePhoto,
  ReservationStatus,
  WorkOrderStatus,
} from "../../types";
import {
  RESERVATION_STATUS_LABELS,
  WORK_ORDER_STATUS_LABELS,
} from "../../types";

type DeviceDetailsProps = {
  deviceId: number;
  onPhotoAdded?: (deviceId: number, photo: DevicePhoto) => void;
  onPhotoDeleted?: (deviceId: number, photoId: number) => void;
};

type PhotoFormState = {
  url: string;
  description: string;
};

type TimelineItem = {
  date: string;
  label: string;
  meta: string;
};

const emptyPhotoForm: PhotoFormState = {
  url: "",
  description: "",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function reservationLabel(status: string) {
  return (
    RESERVATION_STATUS_LABELS[status as ReservationStatus] ?? status
  );
}

function workOrderLabel(status: WorkOrderStatus) {
  return WORK_ORDER_STATUS_LABELS[status] ?? status;
}

function buildTimeline(details: DeviceDetailsData): TimelineItem[] {
  const reservationItems = details.reservations.map((reservation) => ({
    date: reservation.createdAt,
    label: "Reserva creada",
    meta: `${reservationLabel(reservation.status)} - ${formatDateTime(
      reservation.scheduledAt,
    )}`,
  }));

  const workOrderItems = details.workOrders.flatMap((workOrder) => {
    const items: TimelineItem[] = [
      {
        date: workOrder.createdAt,
        label: "Orden de trabajo creada",
        meta: `OT #${workOrder.id} - ${workOrder.problemDescription}`,
      },
    ];

    if (workOrder.status !== "RECEIVED") {
      items.push({
        date: workOrder.updatedAt,
        label: `Estado cambiado a ${workOrder.status}`,
        meta: `OT #${workOrder.id} - ${workOrderLabel(workOrder.status)}`,
      });
    }

    return items;
  });

  return [...reservationItems, ...workOrderItems].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

export function DeviceDetails({
  deviceId,
  onPhotoAdded,
  onPhotoDeleted,
}: DeviceDetailsProps) {
  const [details, setDetails] = useState<DeviceDetailsData | null>(null);
  const [photoForm, setPhotoForm] = useState<PhotoFormState>(emptyPhotoForm);
  const [loading, setLoading] = useState(true);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const [error, setError] = useState("");

  const timeline = useMemo(() => {
    return details ? buildTimeline(details) : [];
  }, [details]);

  useEffect(() => {
    let ignore = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");

        const data = await getDeviceDetails(deviceId);

        if (!ignore) {
          setDetails(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      ignore = true;
    };
  }, [deviceId]);

  function updatePhotoForm(key: keyof PhotoFormState, value: string) {
    setPhotoForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleCreatePhoto() {
    try {
      setSavingPhoto(true);
      setError("");

      const payload = {
        url: photoForm.url.trim(),
        description: photoForm.description.trim() || undefined,
      };

      if (!payload.url) {
        throw new Error("Ingresa la URL de la foto");
      }

      const created = await createDevicePhoto(deviceId, payload);

      setDetails((prev) =>
        prev
          ? {
              ...prev,
              photos: [created, ...prev.photos],
            }
          : prev,
      );
      setPhotoForm(emptyPhotoForm);
      onPhotoAdded?.(deviceId, created);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleDeletePhoto(photoId: number) {
    try {
      setError("");

      await deleteDevicePhoto(photoId);

      setDetails((prev) =>
        prev
          ? {
              ...prev,
              photos: prev.photos.filter((photo) => photo.id !== photoId),
            }
          : prev,
      );
      onPhotoDeleted?.(deviceId, photoId);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando detalle del equipo...</div>;
  }

  if (error && !details) {
    return <p className="alert alert-error">{error}</p>;
  }

  if (!details) {
    return <div className="empty-state">No se encontro el equipo.</div>;
  }

  return (
    <div className="device-details">
      <section className="device-details-section">
        <h3>Cliente</h3>
        <div className="detail-grid">
          <p>
            <strong>Nombre</strong>
            <span>{details.client.name}</span>
          </p>
          <p>
            <strong>Email</strong>
            <span>{details.client.email}</span>
          </p>
          <p>
            <strong>Telefono</strong>
            <span>{details.client.phone ?? "Sin telefono registrado"}</span>
          </p>
        </div>
      </section>

      <section className="device-details-section">
        <h3>Equipo</h3>
        <div className="detail-grid">
          <p>
            <strong>Marca</strong>
            <span>{details.brand}</span>
          </p>
          <p>
            <strong>Modelo</strong>
            <span>{details.model}</span>
          </p>
          <p>
            <strong>Tipo</strong>
            <span>{details.deviceType}</span>
          </p>
          <p>
            <strong>Serie</strong>
            <span>{details.serialNumber ?? "Sin numero de serie"}</span>
          </p>
          <p className="detail-grid-wide">
            <strong>Descripcion</strong>
            <span>{details.description}</span>
          </p>
        </div>
      </section>

      <section className="device-details-section">
        <h3>Fotos</h3>
        <div className="form-grid">
          <label className="field">
            <span>URL</span>
            <input
              placeholder="https://..."
              value={photoForm.url}
              onChange={(e) => updatePhotoForm("url", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Descripcion</span>
            <input
              placeholder="Pantalla rota"
              value={photoForm.description}
              onChange={(e) => updatePhotoForm("description", e.target.value)}
            />
          </label>

          <div className="actions">
            <button
              className="button button-secondary"
              disabled={savingPhoto}
              onClick={handleCreatePhoto}
              type="button"
            >
              Agregar foto
            </button>
          </div>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        {details.photos.length === 0 && (
          <div className="empty-state section">No hay fotos registradas.</div>
        )}

        {details.photos.length > 0 && (
          <div className="device-photo-grid section">
            {details.photos.map((photo) => (
              <figure className="device-photo" key={photo.id}>
                <a href={photo.url} target="_blank" rel="noreferrer">
                  <img src={photo.url} alt={photo.description || "Foto"} />
                </a>
                <figcaption>
                  <span>{photo.description || "Foto"}</span>
                  <button
                    className="button button-danger button-small"
                    onClick={() => handleDeletePhoto(photo.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="device-details-section">
        <h3>Reservas</h3>
        {details.reservations.length === 0 && (
          <div className="empty-state">No hay reservas asociadas.</div>
        )}

        {details.reservations.length > 0 && (
          <div className="compact-list">
            {details.reservations.map((reservation) => (
              <div className="compact-row" key={reservation.id}>
                <div>
                  <strong>{formatDateTime(reservation.scheduledAt)}</strong>
                  <span>{reservation.worker?.name ?? "Sin tecnico"}</span>
                </div>
                <span className="pill pill-blue">
                  {reservationLabel(reservation.status)}
                </span>
                <span className="pill pill-muted">
                  {formatCurrency(reservation.depositAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="device-details-section">
        <h3>Ordenes de trabajo</h3>
        {details.workOrders.length === 0 && (
          <div className="empty-state">No hay ordenes asociadas.</div>
        )}

        {details.workOrders.length > 0 && (
          <div className="compact-list">
            {details.workOrders.map((workOrder) => (
              <div className="compact-row compact-row-rich" key={workOrder.id}>
                <div>
                  <strong>OT #{workOrder.id}</strong>
                  <span>{workOrder.problemDescription}</span>
                  {workOrder.diagnosis && (
                    <span>Diagnostico: {workOrder.diagnosis}</span>
                  )}
                  {workOrder.worker && (
                    <span>Técnico: {workOrder.worker.name}</span>
                  )}
                  <span>Creada: {formatDateTime(workOrder.createdAt)}</span>
                </div>
                <span className="pill pill-blue">
                  {workOrderLabel(workOrder.status)}
                </span>
                <span className="pill pill-muted">
                  {formatCurrency(workOrder.laborCost)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="device-details-section">
        <h3>Historial resumido</h3>
        {timeline.length === 0 && (
          <div className="empty-state">No hay actividad registrada.</div>
        )}

        {timeline.length > 0 && (
          <div className="device-timeline">
            {timeline.map((item) => (
              <div className="device-timeline-item" key={`${item.label}-${item.date}`}>
                <span>{formatDateTime(item.date)}</span>
                <div>
                  <strong>{item.label}</strong>
                  <p>{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
