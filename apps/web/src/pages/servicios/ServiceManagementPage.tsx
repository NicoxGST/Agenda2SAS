import { useEffect, useState } from "react";

import type { Service } from "../../services/services.service";
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from "../../services/services.service";

type FormState = {
  name: string;
  description: string;
  price: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

export function ServiceManagementPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadInitialServices() {
      try {
        setError("");

        const data = await getServices();

        if (!ignore) {
          setServices(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadInitialServices();

    return () => {
      ignore = true;
    };
  }, []);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
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
          prev.map((service) => (service.id === editingId ? updated : service)),
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

      const updated = await updateService(service.id, {
        isActive: !service.isActive,
      });

      setServices((prev) =>
        prev.map((item) => (item.id === service.id ? updated : item)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");

      await deleteService(id);

      setServices((prev) => prev.filter((service) => service.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Catalogo de atencion</p>
          <h1>Servicios</h1>
          <p className="page-copy">
            Mantiene disponibles los servicios que luego se podran reservar.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{editingId ? "Editar servicio" : "Nuevo servicio"}</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                placeholder="Ej: Diagnostico"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Descripcion</span>
              <input
                placeholder="Detalle del servicio"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Precio</span>
              <input
                min="1"
                placeholder="15000"
                type="number"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
            </label>
          </div>

          <div className="actions section">
            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              {editingId ? "Guardar cambios" : "Crear servicio"}
            </button>

            {editingId && (
              <button
                className="button button-ghost"
                disabled={loading}
                onClick={resetForm}
                type="button"
              >
                Cancelar
              </button>
            )}
          </div>

          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </section>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Listado</h2>
            <p className="page-copy">
              {services.length} servicio{services.length === 1 ? "" : "s"} en
              el catalogo.
            </p>
          </div>
        </div>

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
                <span
                  className={
                    service.isActive ? "pill pill-success" : "pill pill-muted"
                  }
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="actions">
                <button
                  className="button button-secondary"
                  onClick={() => startEditing(service)}
                  type="button"
                >
                  Editar
                </button>

                <button
                  className="button button-warning"
                  onClick={() => handleToggle(service)}
                  type="button"
                >
                  {service.isActive ? "Desactivar" : "Activar"}
                </button>

                <button
                  className="button button-danger"
                  onClick={() => handleDelete(service.id)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
