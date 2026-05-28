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
    <div>
      <h1>Productos</h1>

      <div>
        <input
          placeholder="nombre"
          value={form.name}
          onChange={(e) => updateForm("name", e.target.value)}
        />

        <input
          placeholder="descripcion"
          value={form.description}
          onChange={(e) => updateForm("description", e.target.value)}
        />

        <input
          type="number"
          min="1"
          placeholder="precio"
          value={form.price}
          onChange={(e) => updateForm("price", e.target.value)}
        />

        <input
          type="number"
          min="0"
          placeholder="stock"
          value={form.stock}
          onChange={(e) => updateForm("stock", e.target.value)}
        />

        <button onClick={handleSubmit} disabled={loading}>
          {editingId ? "Guardar" : "+ Crear Producto"}
        </button>

        {editingId && (
          <button onClick={resetForm} disabled={loading}>
            Cancelar
          </button>
        )}
      </div>

      {error && <p>{error}</p>}

      <div>
        {products.map((product) => (
          <div key={product.id}>
            <h2>{product.name}</h2>

            <p>{product.description}</p>

            <p>Precio: ${product.price}</p>

            <p>Stock: {product.stock}</p>

            <p>{product.isActive ? "Activo" : "Inactivo"}</p>

            <button onClick={() => startEditing(product)}>Editar</button>

            <button onClick={() => handleToggle(product)}>
              {product.isActive ? "Desactivar" : "Activar"}
            </button>

            <button onClick={() => handleDelete(product.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
