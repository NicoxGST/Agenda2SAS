import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";

import { ROLES } from "../../constants/roles";
import { logoutRequest } from "../../services/auth.service";
import { logout, useAuth } from "../../store/auth.store";

type MenuItem = {
  to: string;
  label: string;
};

const roleMenus: Record<string, MenuItem[]> = {
  [ROLES.CLIENT]: [
    {
      to: "/client",
      label: "Mi Panel",
    },
  ],

  [ROLES.WORKER]: [
    {
      to: "/worker",
      label: "Gestor",
    },
  ],

  [ROLES.ADMIN]: [
    {
      to: "/admin",
      label: "Panel Admin",
    },

    {
      to: "/users",
      label: "Gestion",
    },

    {
      to: "/servicios",
      label: "Servicios",
    },

    {
      to: "/productos",
      label: "Productos",
    },
  ],

  [ROLES.SUPER_ADMIN]: [
    {
      to: "/admin",
      label: "Panel Admin",
    },

    {
      to: "/users",
      label: "Gestion",
    },

    {
      to: "/servicios",
      label: "Servicios",
    },

    {
      to: "/productos",
      label: "Productos",
    },
  ],
};

export function Navbar() {
  const navigate = useNavigate();

  const auth = useAuth();

  const user = auth.user;

  const [open, setOpen] = useState(false);

  const menu = user
    ? roleMenus[user.role] || []
    : [
        {
          to: "/login",
          label: "Login",
        },

        {
          to: "/register",
          label: "Registro",
        },
      ];

  function closeMenu() {
    setOpen(false);
  }

  async function handleLogout() {
    try {
      if (auth.accessToken) {
        await logoutRequest(auth.accessToken);
      }
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      logout();

      navigate("/");
    }
  }

  function handleMenuToggle() {
    setOpen((current) => !current);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/" onClick={closeMenu}>
          <span className="brand-mark">A2</span>
          <span>Agenda2SAS</span>
        </Link>

        <NavLink className="nav-home-link" to="/" onClick={closeMenu}>
          Inicio
        </NavLink>

        <button
          aria-expanded={open}
          aria-label={open ? "Cerrar menu" : "Abrir menu"}
          className="hamburger-button"
          onClick={handleMenuToggle}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          aria-label="Menu principal"
          className={`nav-panel ${open ? "is-open" : ""}`}
        >
          {user && (
            <div className="nav-user">
              <div className="nav-user-text">
                <span className="nav-user-name">{user.name}</span>
                <span className="nav-user-role">{user.role}</span>
              </div>
            </div>
          )}

          <div className="nav-links">
            {menu.map((item) => (
              <NavLink
                className="nav-link"
                key={item.to}
                to={item.to}
                onClick={closeMenu}
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          {user && (
            <div className="nav-footer">
              <button
                className="button button-ghost"
                onClick={handleLogout}
                type="button"
              >
                Salir
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
