import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";
import { ClientChatBot } from "../components/chatbot/ClientChatBot";

import { ROLES } from "../constants/roles";
import { useAuth } from "../store/auth.store";

const fullPageRoutes = ["/login", "/register"];
const wideRoutes    = ["/", "/servicios", "/productos"];

export function MainLayout() {
  const location = useLocation();
  const auth = useAuth();
  const user = auth.user;

  const isFullPage = fullPageRoutes.includes(location.pathname);
  const isWide     = wideRoutes.includes(location.pathname);
  const canShowChatbot = !user || user.role === ROLES.CLIENT;

  return (
    <div className="app-shell">
      {!isFullPage && <Navbar />}

      {isFullPage || isWide ? (
        <Outlet />
      ) : (
        <main className="page">
          <Outlet />
        </main>
      )}

      {canShowChatbot && !isFullPage && <ClientChatBot />}
    </div>
  );
}
