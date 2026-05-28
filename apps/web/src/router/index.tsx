import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";

import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RouteGuard } from "../components/auth/RouteGuard";
import { ROLES } from "../constants/roles";

import { AdminPage } from "../pages/admin/AdminPage";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { WorkerPage } from "../pages/trabajador/WorkerPage";
import { ClientPage } from "../pages/cliente/ClientPage";
import { ServiceManagementPage } from "../pages/servicios/ServiceManagementPage";
import { ProductManagementPage } from "../pages/productos/ProductManagementPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,

    children: [
      {
        index: true,
        element: <HomePage />,
      },

      {
        path: "login",
        element: <LoginPage />,
      },

      {
        path: "register",
        element: <RegisterPage />,
      },

      {
        path: "admin",

        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminPage />
          </RouteGuard>
        ),
      },

      {
        path: "users",

        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <UserManagementPage />
          </RouteGuard>
        ),
      },

      {
        path: "servicios",

        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ServiceManagementPage />
          </RouteGuard>
        ),
      },

      {
        path: "productos",

        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ProductManagementPage />
          </RouteGuard>
        ),
      },

      {
        path: "worker",

        element: (
          <RouteGuard
            allowedRoles={[ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
          >
            <WorkerPage />
          </RouteGuard>
        ),
      },

      {
        path: "client",

        element: (
          <RouteGuard
            allowedRoles={[
              ROLES.CLIENT,
              ROLES.WORKER,
              ROLES.ADMIN,
              ROLES.SUPER_ADMIN,
            ]}
          >
            <ClientPage />
          </RouteGuard>
        ),
      },
    ],
  },
]);
