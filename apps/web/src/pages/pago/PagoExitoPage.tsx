import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPayment, verifyByRef } from "../../services/payments.service";

type Estado = "cargando" | "confirmado" | "pendiente" | "error";

const REDIRECT_SECONDS = 10;

export function PagoExitoPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [reservationId, setReservationId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  const paymentId = searchParams.get("payment_id");
  const ref = searchParams.get("ref");

  const verificar = useCallback(() => {
    if (!paymentId && !ref) { setEstado("error"); return; }
    setEstado("cargando");
    const promise = ref ? verifyByRef(ref) : verifyPayment(paymentId!);
    promise.then((res) => {
        if (res.status === "approved") {
          setReservationId(res.reservationId ?? null);
          setEstado("confirmado");
          setCountdown(REDIRECT_SECONDS);
        } else {
          setEstado("pendiente");
        }
      })
      .catch(() => setEstado("error"));
  }, [paymentId, ref]);

  useEffect(() => { verificar(); }, [verificar]);

  useEffect(() => {
    if (estado !== "confirmado") return;
    if (countdown <= 0) { navigate("/client"); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [estado, countdown, navigate]);

  if (estado === "cargando") {
    return (
      <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <div className="db-card-body">
          <p>Verificando tu pago…</p>
        </div>
      </div>
    );
  }

  if (estado === "confirmado") {
    return (
      <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <div className="db-card-body">
          <h2 style={{ color: "var(--color-success, #16a34a)", marginBottom: 8 }}>
            ¡Reserva confirmada!
          </h2>
          <p style={{ marginBottom: 4 }}>
            Tu abono de <strong>$5.000 CLP</strong> fue recibido correctamente.
          </p>
          {reservationId && (
            <p className="item-meta">N° de reserva: <strong>#{reservationId}</strong></p>
          )}
          <p className="item-meta" style={{ marginBottom: 24 }}>
            Recibirás un correo con los detalles de tu cita.
          </p>
          <p className="item-meta" style={{ marginBottom: 16 }}>
            Redirigiendo en {countdown} segundo{countdown !== 1 ? "s" : ""}…
          </p>
          <button
            className="button button-primary"
            onClick={() => navigate("/client")}
            type="button"
          >
            Ver mis reservas
          </button>
        </div>
      </div>
    );
  }

  if (estado === "pendiente") {
    return (
      <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
        <div className="db-card-body">
          <h2 style={{ marginBottom: 8 }}>Pago en proceso</h2>
          <p style={{ marginBottom: 24 }}>
            Tu pago está siendo procesado. Si ya se realizó el cobro, haz clic en "Verificar de nuevo".
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              className="button button-primary"
              onClick={verificar}
              type="button"
            >
              Verificar de nuevo
            </button>
            <button
              className="button button-secondary"
              onClick={() => navigate("/client")}
              type="button"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div className="db-card-body">
        <h2 style={{ marginBottom: 8 }}>Ocurrió un problema</h2>
        <p style={{ marginBottom: 24 }}>
          No pudimos verificar tu pago. Si se realizó el cobro, contáctanos y te ayudamos.
        </p>
        <button
          className="button button-primary"
          onClick={() => navigate("/client")}
          type="button"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
