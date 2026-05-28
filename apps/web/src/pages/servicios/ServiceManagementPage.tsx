import { useEffect, useState } from 'react';

import type { Service } from '../../services/services.service';
import {
  createService,
  deleteService,
  getServices,
  updateService,
} from '../../services/services.service';

type FormState = {
  name: string;
  description: string;
  price: string;
};

const emptyForm: FormState = {
  name: '',
  description: '',
  price: '',
};

export function ServiceManagementPage() {
  const [services, setServices] =
    useState<Service[]>([]);

  const [form, setForm] =
    useState<FormState>(emptyForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function loadServices() {
    try {
      setError('');

      const data =
        await getServices();

      setServices(data);
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadServices();
  }, []);

  function updateForm(
    key: keyof FormState,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(
    service: Service,
  ) {
    setEditingId(service.id);

    setForm({
      name: service.name,
      description:
        service.description,
      price: String(
        service.price,
      ),
    });
  }

  async function handleSubmit() {
    try {
      setError('');
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description:
          form.description.trim(),
        price: Number(form.price),
      };

      if (
        !payload.name ||
        !payload.description ||
        !payload.price
      ) {
        throw new Error(
          'Completa todos los campos',
        );
      }

      if (editingId) {
        const updated =
          await updateService(
            editingId,
            payload,
          );

        setServices((prev) =>
          prev.map((service) =>
            service.id === editingId
              ? updated
              : service,
          ),
        );
      } else {
        const created =
          await createService(
            payload,
          );

        setServices((prev) => [
          created,
          ...prev,
        ]);
      }

      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(
    service: Service,
  ) {
    try {
      setError('');

      const updated =
        await updateService(
          service.id,
          {
            isActive:
              !service.isActive,
          },
        );

      setServices((prev) =>
        prev.map((item) =>
          item.id === service.id
            ? updated
            : item,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleDelete(
    id: number,
  ) {
    try {
      setError('');

      await deleteService(id);

      setServices((prev) =>
        prev.filter(
          (service) =>
            service.id !== id,
        ),
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Servicios</h1>

      <div>
        <input
          placeholder="nombre"
          value={form.name}
          onChange={(e) =>
            updateForm(
              'name',
              e.target.value,
            )
          }
        />

        <input
          placeholder="descripcion"
          value={form.description}
          onChange={(e) =>
            updateForm(
              'description',
              e.target.value,
            )
          }
        />

        <input
          type="number"
          min="1"
          placeholder="precio"
          value={form.price}
          onChange={(e) =>
            updateForm(
              'price',
              e.target.value,
            )
          }
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
        >
          {editingId
            ? 'Guardar'
            : '+ Crear Servicio'}
        </button>

        {editingId && (
          <button
            onClick={resetForm}
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>

      {error && <p>{error}</p>}

      <div>
        {services.map((service) => (
          <div key={service.id}>
            <h2>{service.name}</h2>

            <p>
              {service.description}
            </p>

            <p>
              ${service.price}
            </p>

            <p>
              {service.isActive
                ? 'Activo'
                : 'Inactivo'}
            </p>

            <button
              onClick={() =>
                startEditing(
                  service,
                )
              }
            >
              Editar
            </button>

            <button
              onClick={() =>
                handleToggle(
                  service,
                )
              }
            >
              {service.isActive
                ? 'Desactivar'
                : 'Activar'}
            </button>

            <button
              onClick={() =>
                handleDelete(
                  service.id,
                )
              }
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
