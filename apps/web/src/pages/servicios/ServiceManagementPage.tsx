import { useEffect, useMemo, useState } from "react";
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
  const auth = useAuth();

  const isManager =
    auth.user?.role === ROLES.ADMIN ||
    auth.user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    let ignore = false;

    async function loadInitialServices() {
      try {
        setError("");

        const data = isManager
          ? await getServices()
          : await getPublicServices();

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
            Lista de servicios registrados con nombre y precio.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Listado</h2>
            <p className="page-copy">
              {services.length} servicio{services.length === 1 ? "" : "s"} disponibles.
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
              </div>

              <div className="item-metrics">
                <span className="pill pill-blue">${service.price}</span>
              </div>

            </article>
          ))}
        </div>
      </section>
    </>
  );
}
