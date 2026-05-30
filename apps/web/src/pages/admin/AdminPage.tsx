import { Link } from "react-router-dom";

const adminLinks = [
  {
    to: "/users",
    title: "Usuarios",
    text: "Crear usuarios, cambiar roles y mantener el acceso ordenado.",
  },
  {
    to: "/servicios",
    title: "Servicios",
    text: "Administrar servicios disponibles, precios y estado activo.",
  },
  {
    to: "/productos",
    title: "Productos",
    text: "Controlar catalogo, stock y estado de productos.",
  },
];

export function AdminPage() {
  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel administrador</p>
          <h1>Gestion general</h1>
          <p className="page-copy">
            Accesos principales para mantener la informacion base del sistema.
          </p>
        </div>
      </header>

      <section className="dashboard-links">
        {adminLinks.map((item) => (
          <Link className="dashboard-link" key={item.to} to={item.to}>
            <h2>{item.title}</h2>
            <p className="item-description">{item.text}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
