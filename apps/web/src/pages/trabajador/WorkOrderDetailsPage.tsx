import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { WorkOrderDetail, WorkOrderHistoryEntry, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";
import { getWorkOrderDetail, getWorkOrderHistory, updateWorkOrderStatus, updateWorkOrder } from "../../services/work-orders.service";
import { createDevicePhoto, deleteDevicePhoto, resolvePhotoUrl, updateDevicePhoto, uploadDevicePhoto } from "../../services/devices.service";

const statusPill: Record<WorkOrderStatus, string> = {
  RECEIVED:      "pill-blue",
  DIAGNOSIS:     "pill-orange",
  WAITING_PARTS: "pill-orange",
  IN_REPAIR:     "pill-blue",
  READY:         "pill-success",
  DELIVERED:     "pill-success",
  CANCELLED:     "pill-muted",
};

const ALL_STATUSES: WorkOrderStatus[] = [
  "RECEIVED", "DIAGNOSIS", "WAITING_PARTS", "IN_REPAIR", "READY", "DELIVERED", "CANCELLED",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
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

const subsectionStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--muted)",
  marginBottom: "0.75rem",
};

export function WorkOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [workOrder, setWorkOrder]           = useState<WorkOrderDetail | null>(null);
  const [history, setHistory]               = useState<WorkOrderHistoryEntry[]>([]);
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  type PhotoEntry = { id: number; url: string; description?: string | null; createdAt: string };
  const [photos, setPhotos]               = useState<PhotoEntry[]>([]);
  const [addPhotoForm, setAddPhotoForm]   = useState({ description: "" });
  const [addPhotoFile, setAddPhotoFile]   = useState<File | null>(null);
  const [editPhotoId, setEditPhotoId]     = useState<number | null>(null);
  const [editPhotoForm, setEditPhotoForm] = useState({ description: "" });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [savingPhoto, setSavingPhoto]     = useState(false);
  const [photoError, setPhotoError]       = useState("");

  const [laborCostInput, setLaborCostInput]   = useState("");
  const [savingLaborCost, setSavingLaborCost] = useState(false);
  const [laborCostError, setLaborCostError]   = useState("");

  useEffect(() => {
    if (!id) return;
    let ignore = false;

    async function load() {
      try {
        setError("");
        const [data, hist] = await Promise.all([
          getWorkOrderDetail(Number(id)),
          getWorkOrderHistory(Number(id)),
        ]);
        if (!ignore) {
          setWorkOrder(data);
          setHistory(hist);
          setPhotos(data.device?.photos ?? []);
          setLaborCostInput(String(data.laborCost));
        }
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void load();
    return () => { ignore = true; };
  }, [id]);

  async function handleSaveLaborCost() {
    if (!workOrder) return;
    const value = Math.round(Number(laborCostInput));
    if (isNaN(value) || value < 0) {
      setLaborCostError("Ingresa un valor válido (mínimo 0).");
      return;
    }
    try {
      setSavingLaborCost(true);
      setLaborCostError("");
      await updateWorkOrder(workOrder.id, { laborCost: value });
      setWorkOrder((prev) => prev ? { ...prev, laborCost: value } : prev);
    } catch (err: unknown) {
      setLaborCostError(getErrorMessage(err));
    } finally {
      setSavingLaborCost(false);
    }
  }

  async function handleAddPhoto() {
    if (!workOrder?.device) return;
    if (!addPhotoFile) { setPhotoError("Selecciona una foto."); return; }
    try {
      setSavingPhoto(true);
      setPhotoError("");
      const { url } = await uploadDevicePhoto(addPhotoFile);
      const created = await createDevicePhoto(workOrder.device.id, {
        url,
        description: addPhotoForm.description.trim() || undefined,
      });
      setPhotos((prev) => [created, ...prev]);
      setAddPhotoForm({ description: "" });
      setAddPhotoFile(null);
    } catch (err: unknown) {
      setPhotoError(getErrorMessage(err));
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleDeletePhoto(photoId: number) {
    try {
      setPhotoError("");
      await deleteDevicePhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err: unknown) {
      setPhotoError(getErrorMessage(err));
    }
  }

  function startEditPhoto(photo: PhotoEntry) {
    setEditPhotoId(photo.id);
    setEditPhotoForm({ description: photo.description ?? "" });
    setEditPhotoFile(null);
  }

  async function handleSaveEditPhoto(photoId: number) {
    try {
      setSavingPhoto(true);
      setPhotoError("");

      let url: string | undefined;
      if (editPhotoFile) {
        const result = await uploadDevicePhoto(editPhotoFile);
        url = result.url;
      }

      const updated = await updateDevicePhoto(photoId, {
        url,
        description: editPhotoForm.description.trim() || undefined,
      });
      setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, ...updated } : p)));
      setEditPhotoId(null);
      setEditPhotoFile(null);
    } catch (err: unknown) {
      setPhotoError(getErrorMessage(err));
    } finally {
      setSavingPhoto(false);
    }
  }

  async function handleUpdateStatus(newStatus: WorkOrderStatus) {
    if (!workOrder || statusUpdating || workOrder.status === newStatus) return;
    try {
      setStatusUpdating(true);
      setError("");
      await updateWorkOrderStatus(workOrder.id, newStatus);
      setWorkOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
      const hist = await getWorkOrderHistory(workOrder.id);
      setHistory(hist);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  }

  if (loading) {
    return <div className="empty-state">Cargando orden de trabajo...</div>;
  }

  if (error && !workOrder) {
    return (
      <div>
        <button
          className="button button-secondary"
          onClick={() => navigate(-1)}
          type="button"
        >
          ← Volver
        </button>
        <p className="alert alert-error" style={{ marginTop: "1rem" }}>{error}</p>
      </div>
    );
  }

  if (!workOrder) {
    return <div className="empty-state">Orden no encontrada.</div>;
  }

  const client = workOrder.reservation?.client ?? workOrder.device?.client;

  return (
    <>
      <div className="db-welcome">
        <button
          className="button button-secondary"
          onClick={() => navigate(-1)}
          type="button"
          style={{ marginBottom: "0.75rem" }}
        >
          ← Volver
        </button>
        <span className="db-welcome-tag">Orden de trabajo</span>
        <h2>OT #{workOrder.id}</h2>
      </div>

      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Información general ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Información general</h3>
        </div>
        <div className="db-card-body">

          {client && (
            <div>
              <p style={subsectionStyle}>Cliente</p>
              <div className="detail-grid">
                <p>
                  <strong>Nombre</strong>
                  <span>{client.name}</span>
                </p>
                <p>
                  <strong>Correo</strong>
                  <span>{client.email}</span>
                </p>
                {workOrder.reservation?.contactPhone && (
                  <p>
                    <strong>Teléfono</strong>
                    <span>{workOrder.reservation.contactPhone}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {workOrder.device && (
            <div className="section">
              <p style={subsectionStyle}>Equipo</p>
              <div className="detail-grid">
                <p>
                  <strong>Marca</strong>
                  <span>{workOrder.device.brand}</span>
                </p>
                <p>
                  <strong>Modelo</strong>
                  <span>{workOrder.device.model}</span>
                </p>
                <p>
                  <strong>Tipo</strong>
                  <span>{workOrder.device.deviceType}</span>
                </p>
                <p>
                  <strong>Serie</strong>
                  <span>{workOrder.device.serialNumber ?? "Sin número de serie"}</span>
                </p>
              </div>
            </div>
          )}

          {workOrder.device && (
            <div className="section">
              <p style={subsectionStyle}>
                Galería
                {photos.length > 0 && (
                  <span className="pill pill-muted db-pill-sm" style={{ marginLeft: "0.5rem" }}>
                    {photos.length} foto{photos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>

              {/* ── Agregar foto ── */}
              <div className="form-grid" style={{ marginBottom: "1rem" }}>
                <label className="field">
                  <span>Foto</span>
                  <input
                    accept="image/*"
                    type="file"
                    onChange={(e) => setAddPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label className="field">
                  <span>Descripción</span>
                  <input
                    placeholder="Pantalla rota, golpe lateral…"
                    value={addPhotoForm.description}
                    onChange={(e) => setAddPhotoForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>
                <div className="actions">
                  <button
                    className="button button-secondary button-small"
                    disabled={savingPhoto || !addPhotoFile}
                    onClick={handleAddPhoto}
                    type="button"
                  >
                    {savingPhoto ? "Subiendo..." : "Agregar foto"}
                  </button>
                </div>
              </div>

              {photoError && (
                <p className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{photoError}</p>
              )}

              {photos.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 0 }}>Sin fotos registradas.</div>
              ) : (
                <div className="device-photo-grid">
                  {photos.map((photo) => (
                    <figure className="device-photo" key={photo.id}>
                      {editPhotoId === photo.id ? (
                        <div className="form-grid" style={{ padding: "0.5rem" }}>
                          <label className="field">
                            <span>Nueva foto (opcional)</span>
                            <input
                              accept="image/*"
                              type="file"
                              onChange={(e) => setEditPhotoFile(e.target.files?.[0] ?? null)}
                            />
                          </label>
                          <label className="field">
                            <span>Descripción</span>
                            <input
                              value={editPhotoForm.description}
                              onChange={(e) =>
                                setEditPhotoForm((prev) => ({ ...prev, description: e.target.value }))
                              }
                            />
                          </label>
                          <div className="actions">
                            <button
                              className="button button-primary button-small"
                              disabled={savingPhoto}
                              onClick={() => handleSaveEditPhoto(photo.id)}
                              type="button"
                            >
                              {savingPhoto ? "Guardando..." : "Guardar"}
                            </button>
                            <button
                              className="button button-secondary button-small"
                              onClick={() => setEditPhotoId(null)}
                              type="button"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <a href={resolvePhotoUrl(photo.url)} target="_blank" rel="noreferrer">
                            <img src={resolvePhotoUrl(photo.url)} alt={photo.description ?? "Foto del equipo"} />
                          </a>
                          <figcaption>
                            <span>{photo.description || "Foto"}</span>
                            <button
                              className="button button-secondary button-small"
                              onClick={() => startEditPhoto(photo)}
                              type="button"
                            >
                              Editar
                            </button>
                            <button
                              className="button button-danger button-small"
                              onClick={() => handleDeletePhoto(photo.id)}
                              type="button"
                            >
                              Eliminar
                            </button>
                          </figcaption>
                        </>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Reparación ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Reparación</h3>
        </div>
        <div className="db-card-body">
          <div className="detail-grid">
            <p className="detail-grid-wide">
              <strong>Problema reportado</strong>
              <span>{workOrder.problemDescription}</span>
            </p>
            {workOrder.diagnosis && (
              <p className="detail-grid-wide">
                <strong>Diagnóstico</strong>
                <span>{workOrder.diagnosis}</span>
              </p>
            )}
            <p>
              <strong>Mano de obra</strong>
              <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <input
                  min="0"
                  style={{ width: "7rem" }}
                  type="number"
                  value={laborCostInput}
                  onChange={(e) => setLaborCostInput(e.target.value)}
                />
                <button
                  className="button button-secondary button-small"
                  disabled={savingLaborCost}
                  onClick={handleSaveLaborCost}
                  type="button"
                >
                  {savingLaborCost ? "Guardando…" : "Guardar"}
                </button>
                {workOrder.laborCost > 0 && (
                  <span className="pill pill-muted">
                    {formatCurrency(workOrder.laborCost)}
                  </span>
                )}
              </span>
            </p>
            {laborCostError && (
              <p className="alert alert-error" style={{ gridColumn: "1 / -1", marginTop: "0.25rem" }}>
                {laborCostError}
              </p>
            )}
            <p>
              <strong>Creado</strong>
              <span>{formatDateTime(workOrder.createdAt)}</span>
            </p>
            {workOrder.reservation && (
              <p>
                <strong>Visita agendada</strong>
                <span>{formatDateTime(workOrder.reservation.scheduledAt)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Estado ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Estado</h3>
          <span className={`pill ${statusPill[workOrder.status]}`}>
            {WORK_ORDER_STATUS_LABELS[workOrder.status]}
          </span>
        </div>
        <div className="db-card-body">
          <div className="slot-grid">
            {ALL_STATUSES.map((s) => (
              <button
                className={`button button-small ${workOrder.status === s ? "button-primary" : "button-secondary"}`}
                disabled={statusUpdating}
                key={s}
                onClick={() => handleUpdateStatus(s)}
                type="button"
              >
                {WORK_ORDER_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Historial ── */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Historial</h3>
          <span className="pill pill-muted db-pill-sm">
            {history.length} evento{history.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="db-card-body">
          {history.length === 0 && (
            <div className="empty-state section">Sin cambios de estado registrados.</div>
          )}
          {history.length > 0 && (
            <div className="device-timeline">
              {history.map((entry) => (
                <div className="device-timeline-item" key={entry.id}>
                  <span>{formatDateTime(entry.createdAt)}</span>
                  <div>
                    <strong>
                      {WORK_ORDER_STATUS_LABELS[entry.previousStatus]}
                      {" → "}
                      {WORK_ORDER_STATUS_LABELS[entry.newStatus]}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
