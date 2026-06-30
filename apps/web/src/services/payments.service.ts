import { apiFetch } from "./api";
import { getAuth } from "../store/auth.store";

type CheckoutPayload = {
  workerId: number;
  serviceId: number;
  scheduledAt: string;
  contactPhone: string;
  clientNotes?: string;
};

type CheckoutResult = {
  initPoint: string;
  externalRef: string;
};

type VerifyResult = {
  status: string;
  reservationId?: number;
};

function authHeaders(): Record<string, string> {
  const auth = getAuth();
  return { Authorization: `Bearer ${auth.accessToken}` };
}

export function createCheckout(data: CheckoutPayload): Promise<CheckoutResult> {
  return apiFetch("/payments/checkout", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
}

export function verifyPayment(paymentId: string): Promise<VerifyResult> {
  return apiFetch(`/payments/verify?paymentId=${paymentId}`, {
    headers: authHeaders(),
  });
}

export function verifyByRef(ref: string): Promise<VerifyResult> {
  return apiFetch(`/payments/verify?ref=${encodeURIComponent(ref)}`, {
    headers: authHeaders(),
  });
}
