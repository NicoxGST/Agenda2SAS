import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { WorkOrderDetail, WorkOrderHistoryEntry, WorkOrderStatus } from "../../types";
import { WORK_ORDER_STATUS_LABELS } from "../../types";
import type { Worker } from "../../types";
import { getWorkOrderDetail, getWorkOrderHistory, updateWorkOrderStatus, updateWorkOrder, addWorkOrderProduct, removeWorkOrderProduct } from "../../services/work-orders.service";
import type { WorkOrderProduct } from "../../services/work-orders.service";
import { createDevicePhoto, deleteDevicePhoto, resolvePhotoUrl, updateDevicePhoto, uploadDevicePhoto } from "../../services/devices.service";
import { getWorkers } from "../../services/availability.service";
import { ROLES } from "../../constants/roles";
import { useAuth } from "../../store/auth.store";

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
  const auth = useAuth();
  const user = auth.user;
  const canReassign = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN;

  const [workOrder, setWorkOrder]           = useState<WorkOrderDetail | null>(null);
  const [history, setHistory]               = useState<WorkOrderHistoryEntry[]>([]);
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [workers, setWorkers]               = useState<Worker[]>([]);
  const [reassignWorkerId, setReassignWorkerId] = useState("");
  const [savingReassign, setSavingReassign] = useState(false);
  const [reassignError, setReassignError]   = useState("");

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

  const [products, setProducts]               = useState<WorkOrderProduct[]>([]);
  const [productIdInput, setProductIdInput]   = useState("");
  const [productQtyInput, setProductQtyInput] = useState("1");
  const [savingProduct, setSavingProduct]     = useState(false);
  const [productError, setProductError]       = useState("");

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
          setReassignWorkerId(String(data.workerId));
          setProducts(data.workOrderProducts ?? []);
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

  useEffect(() => {
    if (!canReassign) return;
    let ignore = false;
    getWorkers()
      .then((data) => { if (!ignore) setWorkers(data); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [canReassign]);

  async function handleReassign() {
    if (!workOrder || !reassignWorkerId) return;
    const newId = Number(reassignWorkerId);
    if (newId === workOrder.workerId) return;
    try {
      setSavingReassign(true);
      setReassignError("");
      await updateWorkOrder(workOrder.id, { workerId: newId });
      setWorkOrder((prev) => prev ? { ...prev, workerId: newId } : prev);
    } catch (err: unknown) {
      setReassignError(getErrorMessage(err));
    } finally {
      setSavingReassign(false);
    }
  }

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

  async function handleAddProduct() {
    if (!workOrder || !productIdInput) return;
    const qty = Math.max(1, Number(productQtyInput) || 1);
    try {
      setSavingProduct(true);
      setProductError("");
      const entry = await addWorkOrderProduct(workOrder.id, Number(productIdInput), qty);
      setProducts((prev) => [...prev, entry]);
      setProductIdInput("");
      setProductQtyInput("1");
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "Error al agregar producto");
    } finally {
      setSavingProduct(false);
    }
  }

  async function handleRemoveProduct(entryId) {
    if (!workOrder) return;
    try {
      setProductError("");
      await removeWorkOrderProduct(workOrder.id, entryId);
      setProducts((prev) => prev.filter((p) => p.id !== entryId));
    } catch (err) {
      setProductError(err instanceof Error ? err.message : "Error al quitar producto");
    }
  }

  async function handleUpdateStatus(newStatus) {
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

            {canReassign && workers.length > 0 && (
              <p>
                <strong>Técnico asignado</strong>
                <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    style={{ minWidth: "10rem" }}
                    value={reassignWorkerId}
                    onChange={(e) => setReassignWorkerId(e.target.value)}
                  >
                    <option value="">Seleccionar</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                  <button
                    className="button button-secondary button-small"
                    disabled={
                      savingReassign ||
                      !reassignWorkerId ||
                      Number(reassignWorkerId) === workOrder.workerId
                    }
                    onClick={handleReassign}
                    type="button"
                  >
                    {savingReassign ? "Guardando…" : "Reasignar"}
                  </button>
                </span>
              </p>
            )}
            {reassignError && (
              <p className="alert alert-error" style={{ gridColumn: "1 / -1", marginTop: "0.25rem" }}>
                {reassignError}
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
            {/* Productos utilizados */}
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Productos utilizados</h3>
          {products.length > 0 && (
            <span className="pill pill-muted db-pill-sm">
              {products.length} ítem{products.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="db-card-body">
          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <label className="field">
              <span>ID del producto</span>
              <input
                placeholder="Ej: 3"
                type="number"
                min="1"
                value={productIdInput}
                onChange={(e) => setProductIdInput(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Cantidad</span>
              <input
                type="number"
                min="1"
                value={productQtyInput}
                onChange={(e) => setProductQtyInput(e.target.value)}
              />
            </label>
            <div className="actions">
              <button
                className="button button-secondary button-small"
                disabled={savingProduct || !productIdInput}
                onClick={handleAddProduct}
                type="button"
              >
                {savingProduct ? "Agregando..." : "Agregar producto"}
              </button>
            </div>
          </div>
          {productError && <p className="alert alert-error" style={{ marginBottom: "0.75rem" }}>{productError}</p>}
          {products.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 0 }}>Sin productos registrados.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "0.5rem 0", color: "var(--muted)" }}>Producto</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0", color: "var(--muted)" }}>Cant.</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0", color: "var(--muted)" }}>P. unit.</th>
                  <th style={{ textAlign: "right", padding: "0.5rem 0", color: "var(--muted)" }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem 0" }}>{p.product.name}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>{p.quantity}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>{formatCurrency(p.unitPrice)}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>{formatCurrency(p.unitPrice * p.quantity)}</td>
                    <td style={{ textAlign: "right", padding: "0.5rem 0" }}>
                      <button
                        className="button button-danger button-small"
                        onClick={() => handleRemoveProduct(p.id)}
                        type="button"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: "0.75rem 0", fontWeight: 700 }}>Total productos</td>
                  <td style={{ textAlign: "right", padding: "0.75rem 0", fontWeight: 700 }}>
                    {formatCurrency(products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ padding: "0 0 0.5rem 0", fontWeight: 700, color: "var(--color-success, #16a34a)" }}>Costo total estimado</td>
                  <td style={{ textAlign: "right", padding: "0 0 0.5rem 0", fontWeight: 700, color: "var(--color-success, #16a34a)" }}>
                    {formatCurrency((workOrder?.laborCost ?? 0) + products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
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
