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
  const auth = useAuth();

  const isManager =
    auth.user?.role === ROLES.ADMIN ||
    auth.user?.role === ROLES.SUPER_ADMIN;

  useEffect(() => {
    let ignore = false;

    async function loadInitialProducts() {
      try {
        setError("");

        const data = isManager ? await getProducts() : await getPublicProducts();

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
            Lista de productos registrados con nombre y precio.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="page-header">
          <div>
            <h2>Listado</h2>
            <p className="page-copy">
              {products.length} producto{products.length === 1 ? "" : "s"} disponibles.
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
              </div>

              <div className="item-metrics">
                <span className="pill pill-blue">${product.price}</span>
              </div>

            </article>
          ))}
        </div>
      </section>
    </>
  );
}
