import { useNavigate } from "react-router-dom";

export function PagoFalloPage() {
  const navigate = useNavigate();

  return (
    <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div className="db-card-body">
        <h2 style={{ color: "var(--color-danger, #dc2626)", marginBottom: 8 }}>
          Pago rechazado
        </h2>
        <p style={{ marginBottom: 24 }}>
          Tu pago no pudo procesarse. Puedes intentarlo nuevamente o usar otro método de pago.
        </p>
        <div className="actions" style={{ justifyContent: "center" }}>
          <button
            className="button button-primary"
            onClick={() => navigate("/client")}
            type="button"
          >
            Intentar nuevamente
          </button>
          <button
            className="button button-secondary"
            onClick={() => navigate("/")}
            type="button"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
