import { NavLink, useNavigate } from "react-router-dom";

import { ROLES } from "../../constants/roles";
import { logoutRequest } from "../../services/auth.service";
import { logout, useAuth } from "../../store/auth.store";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
};

function IconGrid() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconPackage() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconClipboard() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg className="db-sidebar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14, marginRight: 6 }}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const adminNav: NavItem[] = [
  { to: "/admin",          label: "Dashboard",           icon: <IconGrid />,      end: true },
  { to: "/users",          label: "Usuarios",             icon: <IconUsers /> },
  { to: "/admin/servicios",label: "Servicios",            icon: <IconWrench /> },
  { to: "/admin/productos",label: "Productos",            icon: <IconPackage /> },
  { to: "/worker",         label: "Agenda",               icon: <IconCalendar /> },
  { to: "/ordenes",        label: "Órdenes de trabajo",   icon: <IconClipboard /> },
];

const workerNav: NavItem[] = [
  { to: "/worker",   label: "Mi Agenda",            icon: <IconCalendar />,  end: true },
  { to: "/ordenes",  label: "Órdenes de trabajo",   icon: <IconClipboard /> },
];

const clientNav: NavItem[] = [
  { to: "/client",   label: "Mi Panel",             icon: <IconUser />,      end: true },
  { to: "/servicios",label: "Servicios",            icon: <IconWrench /> },
  { to: "/productos",label: "Productos",            icon: <IconPackage /> },
];

const roleNav: Record<string, NavItem[]> = {
  [ROLES.ADMIN]: adminNav,
  [ROLES.SUPER_ADMIN]: adminNav,
  [ROLES.WORKER]: workerNav,
  [ROLES.CLIENT]: clientNav,
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: Props) {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  const navItems = user ? (roleNav[user.role] ?? []) : [];
  const initials = user ? user.name.slice(0, 2).toUpperCase() : "??";

  async function handleLogout() {
    try {
      if (auth.accessToken) await logoutRequest(auth.accessToken);
    } catch {
      // silently ignore logout errors
    } finally {
      logout();
      navigate("/");
    }
  }

  return (
    <>
      <div
        className={`db-sidebar-overlay ${open ? "visible" : ""}`}
        onClick={onClose}
      />

      <aside className={`db-sidebar ${open ? "is-open" : ""}`}>
        <div className="db-sidebar-brand">
          <img src="/logo.jpeg" alt="LinaresTech" className="db-sidebar-logo" />
        </div>

        <nav className="db-sidebar-nav">
          <p className="db-sidebar-label">Menú</p>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `db-sidebar-link ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}

        </nav>

        <div className="db-sidebar-footer">
          {user && (
            <div className="db-user-row">
              <div className="db-avatar">{initials}</div>
              <div className="db-user-info">
                <span className="db-user-name">{user.name}</span>
                <span className="db-user-role">{user.role}</span>
              </div>
            </div>
          )}

          <button className="db-logout" onClick={handleLogout} type="button">
            <IconLogout />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
