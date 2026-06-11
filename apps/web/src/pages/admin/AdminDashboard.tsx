import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../store/auth.store";
import { getUsers } from "../../services/users.service";
import { getServices } from "../../services/services.service";
import { getProducts } from "../../services/products.service";

type Stats = {
  users: number | null;
  services: number | null;
  products: number | null;
};

function StatCard({
  value,
  label,
  iconClass,
  icon,
  loading,
}: {
  value: number | null;
  label: string;
  iconClass: string;
  icon: string;
  loading: boolean;
}) {
  return (
    <div className="db-stat">
      <div className={`db-stat-icon ${iconClass}`}>{icon}</div>
      <div>
        <div className="db-stat-value">{loading ? "…" : (value ?? "—")}</div>
        <p className="db-stat-label">{label}</p>
      </div>
    </div>
  );
}

const quickLinks = [
  {
    to: "/users",
    icon: "👥",
    iconBg: "db-stat-icon-blue",
    title: "Usuarios",
    desc: "Crear, editar y gestionar roles",
  },
  {
    to: "/servicios",
    icon: "🔧",
    iconBg: "db-stat-icon-orange",
    title: "Servicios",
    desc: "Administrar servicios activos",
  },
  {
    to: "/productos",
    icon: "📦",
    iconBg: "db-stat-icon-green",
    title: "Productos",
    desc: "Catálogo, stock y precios",
  },
  {
    to: "/worker",
    icon: "📅",
    iconBg: "db-stat-icon-purple",
    title: "Agenda",
    desc: "Disponibilidad y reservas",
  },
  {
    to: "/ordenes",
    icon: "📋",
    iconBg: "db-stat-icon-red",
    title: "Órdenes de trabajo",
    desc: "Seguimiento de reparaciones",
  },
];

const statusRows = [
  { dot: "db-dot-green", label: "API de usuarios",    sub: "Operativa", tag: "OK", pill: "pill-success" },
  { dot: "db-dot-green", label: "API de servicios",   sub: "Operativa", tag: "OK", pill: "pill-success" },
  { dot: "db-dot-green", label: "API de productos",   sub: "Operativa", tag: "OK", pill: "pill-success" },
  { dot: "db-dot-green", label: "Órdenes de trabajo", sub: "Operativa", tag: "OK", pill: "pill-success" },
];

const guideRows = [
  { dot: "db-dot-blue",   label: "Agregar nuevo usuario",      sub: "Ir a Usuarios → Nuevo usuario" },
  { dot: "db-dot-orange", label: "Publicar un servicio",       sub: "Ir a Servicios → Agregar servicio" },
  { dot: "db-dot-green",  label: "Gestionar disponibilidad",   sub: "Ir a Agenda → Disponibilidad" },
  { dot: "db-dot-purple", label: "Ver órdenes de trabajo",     sub: "Ir a Agenda → Órdenes" },
];

export function AdminDashboard() {
  const auth = useAuth();
  const user = auth.user;

  const [stats, setStats] = useState<Stats>({ users: null, services: null, products: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [usersRes, servicesRes, productsRes] = await Promise.allSettled([
        getUsers(),
        getServices(),
        getProducts(),
      ]);

      setStats({
        users:
          usersRes.status === "fulfilled" && Array.isArray(usersRes.value)
            ? usersRes.value.length
            : null,
        services:
          servicesRes.status === "fulfilled" && Array.isArray(servicesRes.value)
            ? servicesRes.value.length
            : null,
        products:
          productsRes.status === "fulfilled" && Array.isArray(productsRes.value)
            ? productsRes.value.length
            : null,
      });

      setLoading(false);
    }

    loadStats();
  }, []);

  const firstName = user?.name.split(" ")[0] ?? "Administrador";

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Panel de administración</span>
        <h2>Bienvenido, {firstName} 👋</h2>
        <p>
          Gestiona usuarios, servicios, productos y el calendario de trabajo
          desde un solo lugar.
        </p>
      </div>

      <div className="db-stats">
        <StatCard value={stats.users}    label="Usuarios registrados"    iconClass="db-stat-icon-blue"   icon="👥" loading={loading} />
        <StatCard value={stats.services} label="Servicios activos"       iconClass="db-stat-icon-orange" icon="🔧" loading={loading} />
        <StatCard value={stats.products} label="Productos en catálogo"   iconClass="db-stat-icon-green"  icon="📦" loading={loading} />
        <StatCard value={null}           label="Órdenes pendientes"      iconClass="db-stat-icon-purple" icon="📋" loading={false} />
      </div>

      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Accesos rápidos</h3>
        </div>
        <div className="db-card-body">
          <div className="db-quick-grid db-quick-grid-flush">
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
        </div>
      </div>

      <div className="db-grid-2">
        <div className="db-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Estado del sistema</h3>
            <span className="pill pill-success db-pill-sm">Activo</span>
          </div>
          <div className="db-card-body">
            {statusRows.map((row) => (
              <div key={row.label} className="db-row">
                <div className={`db-row-dot ${row.dot}`} />
                <div className="db-row-body">
                  <p>{row.label}</p>
                  <span>{row.sub}</span>
                </div>
                <span className={`db-row-tag pill ${row.pill}`}>{row.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <h3 className="db-card-title">Guía rápida</h3>
          </div>
          <div className="db-card-body">
            {guideRows.map((row) => (
              <div key={row.label} className="db-row">
                <div className={`db-row-dot ${row.dot}`} />
                <div className="db-row-body">
                  <p>{row.label}</p>
                  <span>{row.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
