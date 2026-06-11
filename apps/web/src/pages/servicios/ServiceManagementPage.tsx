import { useEffect, useState } from "react";
import { useAuth } from "../../store/auth.store";

import type { Service } from "../../services/services.service";
import {
  createService,
  deleteService,
  getPublicServices,
  getServices,
  updateService,
} from "../../services/services.service";
import { ROLES } from "../../constants/roles";

type FormState = {
  name: string;
  description: string;
  price: string;
};

const emptyForm: FormState = { name: "", description: "", price: "" };

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function ServiceManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const isManager =
    auth.user?.role === ROLES.ADMIN || auth.user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    let ignore = false;

    async function loadInitialServices() {
      try {
        setError("");
        const data = isManager ? await getServices() : await getPublicServices();
        if (!ignore) setServices(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialServices();
    return () => { ignore = true; };
  }, [isManager]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
    });
  }

  async function handleSubmit() {
    try {
      setError("");
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
      };

      if (!payload.name || !payload.description || !payload.price) {
        throw new Error("Completa todos los campos");
      }

      if (editingId) {
        const updated = await updateService(editingId, payload);
        setServices((prev) =>
          prev.map((s) => (s.id === editingId ? updated : s)),
        );
      } else {
        const created = await createService(payload);
        setServices((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(service: Service) {
    try {
      setError("");
      const updated = await updateService(service.id, { isActive: !service.isActive });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Catálogo de atención</span>
        <h2>Servicios</h2>
        <p>Lista de servicios registrados con nombre y precio.</p>
      </div>

      {isManager && (
        <div className="db-card db-card-mb">
          <div className="db-card-header">
            <h3 className="db-card-title">
              {editingId ? "Editar servicio" : "Nuevo servicio"}
            </h3>
            {editingId && (
              <button className="button button-ghost button-small" onClick={resetForm} type="button">
                Cancelar
              </button>
            )}
          </div>
          <div className="db-card-body">
            <div className="form-grid">
              <label className="field">
                <span>Nombre</span>
                <input
                  placeholder="Ej: Reparación de pantalla"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Descripción</span>
                <input
                  placeholder="Descripción del servicio"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Precio ($)</span>
                <input
                  min="0"
                  placeholder="0"
                  type="number"
                  value={form.price}
                  onChange={(e) => updateForm("price", e.target.value)}
                />
              </label>
            </div>

            <div className="actions actions-mt">
              <button
                className="button button-primary"
                disabled={loading}
                onClick={handleSubmit}
                type="button"
              >
                {loading ? "Guardando…" : editingId ? "Actualizar" : "Crear servicio"}
              </button>
            </div>

            {error && <p className="alert alert-error">{error}</p>}
          </div>
        </div>
      )}

      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">
            Listado — {services.length} servicio{services.length === 1 ? "" : "s"}
          </h3>
        </div>
        <div className="db-card-body">
          <div className="list">
            {services.length === 0 && (
              <div className="empty-state">No hay servicios registrados.</div>
            )}

            {services.map((service) => (
              <article className="item-row" key={service.id}>
                <div className="item-main">
                  <h3 className="item-title">{service.name}</h3>
                  <p className="item-description">{service.description}</p>
                </div>

                <div className="item-metrics">
                  <span className="pill pill-blue">${service.price}</span>
                  <span className={`pill ${service.isActive ? "pill-success" : "pill-muted"}`}>
                    {service.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {isManager && (
                  <div className="actions">
                    <button
                      className="button button-secondary button-small"
                      onClick={() => startEditing(service)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className={`button button-small ${service.isActive ? "button-warning" : "button-secondary"}`}
                      onClick={() => handleToggle(service)}
                      type="button"
                    >
                      {service.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="button button-danger button-small"
                      onClick={() => handleDelete(service.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
