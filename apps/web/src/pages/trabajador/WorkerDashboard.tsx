import { Link } from "react-router-dom";
import { useAuth } from "../../store/auth.store";

const quickLinks = [
  {
    to: "/worker",
    icon: "📅",
    iconBg: "db-stat-icon-blue",
    title: "Mi disponibilidad",
    desc: "Gestiona tus horarios y turnos",
  },
  {
    to: "/worker",
    icon: "📋",
    iconBg: "db-stat-icon-orange",
    title: "Reservas",
    desc: "Ver y confirmar citas",
  },
  {
    to: "/worker",
    icon: "🔧",
    iconBg: "db-stat-icon-green",
    title: "Órdenes de trabajo",
    desc: "Reparaciones y diagnósticos",
  },
];

export function WorkerDashboard() {
  const auth = useAuth();
  const user = auth.user;
  const firstName = user?.name.split(" ")[0] ?? "Técnico";

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel del trabajador</span>
        <h2>Hola, {firstName} 👋</h2>
        <p>
          Aquí puedes ver tu disponibilidad, gestionar reservas y hacer
          seguimiento de tus órdenes de trabajo.
        </p>
      </div>

      <div className="db-quick-grid">
        {quickLinks.map((item) => (
          <Link key={item.title} className="db-quick-card" to={item.to}>
            <div className={`db-quick-icon ${item.iconBg}`}>{item.icon}</div>
            <div className="db-quick-text">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="db-card">
        <div className="db-card-header">
          <h3 className="db-card-title">Ir al panel completo</h3>
        </div>
        <div className="db-card-body">
          <p className="page-copy db-card-desc">
            Accede a todas tus herramientas: disponibilidad, reservas,
            dispositivos y órdenes de trabajo.
          </p>
          <Link className="button button-primary" to="/worker">
            Abrir panel de trabajo
          </Link>
        </div>
      </div>
    </>
  );
}
