import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <section className="home-hero">
      <div>
        <p className="eyebrow">Gestion operativa</p>
        <h1>Agenda, servicios y productos en un solo lugar</h1>
        <p className="page-copy">
          Panel funcional para administrar usuarios, servicios y productos del
          sistema. Las reservas quedan preparadas como siguiente modulo.
        </p>

        <div className="actions section">
          <Link className="button button-primary" to="/login">
            Entrar al sistema
          </Link>
          <Link className="button button-secondary" to="/register">
            Crear cuenta
          </Link>
        </div>
      </div>

      <div className="hero-panel">
        <h2>Administracion clara</h2>
        <p>
          Usa el menu superior para entrar al panel correspondiente segun tu
          rol. Los accesos se mantienen protegidos por autenticacion y permisos.
        </p>
      </div>
    </section>
  );
}
