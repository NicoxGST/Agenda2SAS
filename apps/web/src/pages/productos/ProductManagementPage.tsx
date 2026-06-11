import { useEffect, useState } from "react";
import { useAuth } from "../../store/auth.store";

import type { Product } from "../../services/products.service";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getPublicProducts,
  updateProduct,
} from "../../services/products.service";
import { ROLES } from "../../constants/roles";

type FormState = {
  name: string;
  description: string;
  price: string;
  stock: string;
};

const emptyForm: FormState = { name: "", description: "", price: "", stock: "" };

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

export function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = useAuth();

  const isManager =
    auth.user?.role === ROLES.ADMIN || auth.user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    let ignore = false;

    async function loadInitialProducts() {
      try {
        setError("");
        const data = isManager ? await getProducts() : await getPublicProducts();
        if (!ignore) setProducts(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialProducts();
    return () => { ignore = true; };
  }, [isManager]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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

      if (!payload.name || !payload.description || !payload.price || payload.stock < 0) {
        throw new Error("Completa todos los campos");
      }

      if (editingId) {
        const updated = await updateProduct(editingId, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p)),
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
      const updated = await updateProduct(product.id, { isActive: !product.isActive });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Inventario</span>
        <h2>Productos</h2>
        <p>Lista de productos registrados con nombre, precio y stock.</p>
      </div>

      {isManager && (
        <div className="db-card db-card-mb">
          <div className="db-card-header">
            <h3 className="db-card-title">
              {editingId ? "Editar producto" : "Nuevo producto"}
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
                  placeholder="Ej: Cable HDMI 2m"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                />
              </label>

              <label className="field">
                <span>Descripción</span>
                <input
                  placeholder="Descripción del producto"
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

              <label className="field">
                <span>Stock</span>
                <input
                  min="0"
                  placeholder="0"
                  type="number"
                  value={form.stock}
                  onChange={(e) => updateForm("stock", e.target.value)}
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
                {loading ? "Guardando…" : editingId ? "Actualizar" : "Crear producto"}
              </button>
            </div>

            {error && <p className="alert alert-error">{error}</p>}
          </div>
        </div>
      )}

      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">
            Listado — {products.length} producto{products.length === 1 ? "" : "s"}
          </h3>
        </div>
        <div className="db-card-body">
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
                  <span className="pill pill-orange">Stock: {product.stock}</span>
                  <span className={`pill ${product.isActive ? "pill-success" : "pill-muted"}`}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {isManager && (
                  <div className="actions">
                    <button
                      className="button button-secondary button-small"
                      onClick={() => startEditing(product)}
                      type="button"
                    >
                      Editar
                    </button>
                    <button
                      className={`button button-small ${product.isActive ? "button-warning" : "button-secondary"}`}
                      onClick={() => handleToggle(product)}
                      type="button"
                    >
                      {product.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      className="button button-danger button-small"
                      onClick={() => handleDelete(product.id)}
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
