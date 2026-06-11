import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "../components/layout/Sidebar";

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/users": "Gestión de usuarios",
  "/admin/servicios": "Gestión de servicios",
  "/admin/productos": "Gestión de productos",
  "/worker": "Agenda",
  "/ordenes": "Órdenes de trabajo",
  "/client": "Mi panel",
};

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const title = routeTitles[location.pathname] ?? "Panel";

  return (
    <div className="dashboard-shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="db-main">
        <header className="db-topbar">
          <div className="db-topbar-left">
            <button
              className="db-hamburger"
              type="button"
              aria-label="Abrir menú"
              onClick={() => setSidebarOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
            <span className="db-topbar-title">{title}</span>
          </div>
        </header>

        <main className="db-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
