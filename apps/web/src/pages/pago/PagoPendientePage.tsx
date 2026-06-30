import { useNavigate } from "react-router-dom";

export function PagoPendientePage() {
  const navigate = useNavigate();

  return (
    <div className="db-card" style={{ maxWidth: 480, margin: "80px auto", textAlign: "center" }}>
      <div className="db-card-body">
        <h2 style={{ marginBottom: 8 }}>Pago pendiente</h2>
        <p style={{ marginBottom: 24 }}>
          Tu pago está siendo revisado. Una vez confirmado, recibirás un correo con los detalles de tu reserva.
        </p>
        <button
          className="button button-secondary"
          onClick={() => navigate("/client")}
          type="button"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
