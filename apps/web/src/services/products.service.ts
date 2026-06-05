import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
};

type ProductPayload = {
  name: string;
  description: string;
  price: number;
  stock: number;
};

function authHeaders() {
  const auth = getAuth();

  if (!auth.accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${auth.accessToken}`,
  };
}

export function getProducts() {
  return apiFetch("/products", {
    headers: authHeaders(),
  });
}

export function getPublicProducts() {
  return apiFetch("/products/public");
}

export function createProduct(data: ProductPayload) {
  return apiFetch("/products", {
    method: "POST",

    headers: authHeaders(),

    body: JSON.stringify(data),
  });
}

export function updateProduct(
  id: number,
  data: Partial<
    ProductPayload & {
      isActive: boolean;
    }
  >,
) {
  return apiFetch(`/products/${id}`, {
    method: "PATCH",

    headers: authHeaders(),

    body: JSON.stringify(data),
  });
}

export function deleteProduct(id: number) {
  return apiFetch(`/products/${id}`, {
    method: "DELETE",

    headers: authHeaders(),
  });
}
