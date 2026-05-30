import { useEffect, useState } from "react";

import type { Product } from "../../services/products.service";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../../services/products.service";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "",
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

export function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadInitialProducts() {
      try {
        setError("");

        const data = await getProducts();

        if (!ignore) {
          setProducts(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadInitialProducts();

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

  function startEditing(product: Product) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
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
        stock: Number(form.stock),
      };

      if (
        !payload.name ||
        !payload.description ||
        !payload.price ||
        payload.stock < 0
      ) {
        throw new Error("Completa todos los campos");
      }

      if (editingId) {
        const updated = await updateProduct(editingId, payload);

        setProducts((prev) =>
          prev.map((product) => (product.id === editingId ? updated : product)),
        );
      } else {
        const created = await createProduct(payload);

        setProducts((prev) => [created, ...prev]);
      }

      resetForm();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(product: Product) {
    try {
      setError("");

      const updated = await updateProduct(product.id, {
        isActive: !product.isActive,
      });

      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? updated : item)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");

      await deleteProduct(id);

      setProducts((prev) => prev.filter((product) => product.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Inventario</p>
          <h1>Productos</h1>
          <p className="page-copy">
            Crea y administra productos, precios, stock y disponibilidad.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{editingId ? "Editar producto" : "Nuevo producto"}</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                placeholder="Ej: Tarjeta Gráfica"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Descripcion</span>
              <input
                placeholder="Detalle"
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Precio</span>
              <input
                min="1"
                placeholder="12990"
                type="number"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
            </label>

            <label className="field">
              <span>Stock</span>
              <input
                min="0"
                placeholder="10"
                type="number"
                value={form.stock}
                onChange={(e) => updateForm("stock", e.target.value)}
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
              {editingId ? "Guardar cambios" : "Crear producto"}
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
              {products.length} producto{products.length === 1 ? "" : "s"} en el
              catalogo.
            </p>
          </div>
        </div>

        <div className="list">
          {products.length === 0 && (
            <div className="empty-state">No hay productos registrados.</div>
          )}

          {products.map((product) => (
            <article className="item-row" key={product.id}>
              <div className="item-main">
                <h3 className="item-title">{product.name}</h3>
                <p className="item-description">{product.description}</p>
              </div>

              <div className="item-metrics">
                <span className="pill pill-blue">${product.price}</span>
                <span className="pill pill-orange">Stock {product.stock}</span>
                <span
                  className={
                    product.isActive ? "pill pill-success" : "pill pill-muted"
                  }
                >
                  {product.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="actions">
                <button
                  className="button button-secondary"
                  onClick={() => startEditing(product)}
                  type="button"
                >
                  Editar
                </button>

                <button
                  className="button button-warning"
                  onClick={() => handleToggle(product)}
                  type="button"
                >
                  {product.isActive ? "Desactivar" : "Activar"}
                </button>

                <button
                  className="button button-danger"
                  onClick={() => handleDelete(product.id)}
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
