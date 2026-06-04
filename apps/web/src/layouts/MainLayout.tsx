import { Outlet, useLocation } from "react-router-dom";

import { Navbar } from "../components/layout/Navbar";

import { ClientChatBot } from "../components/chatbot/ClientChatBot";

import { ROLES } from "../constants/roles";
import { useAuth } from "../store/auth.store";

export function MainLayout() {
  const location = useLocation();

  const auth = useAuth();

  const user = auth.user;

  const hiddenChatbotPaths = [
    "/admin",
    "/users",
    "/servicios",
    "/productos",
    "/worker",
  ];

  const isHiddenPath = hiddenChatbotPaths.some((path) =>
    location.pathname.startsWith(path),
  );

  const canShowChatbot = !isHiddenPath && (!user || user.role === ROLES.CLIENT);
  return (
    <div className="app-shell">
      <Navbar />

      <main className="page">
        <Outlet />
      </main>

      {canShowChatbot && <ClientChatBot />}
    </div>
  );
}
