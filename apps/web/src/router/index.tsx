import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { DashboardLayout } from "../layouts/DashboardLayout";

import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { RouteGuard } from "../components/auth/RouteGuard";
import { ROLES } from "../constants/roles";

import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { UserManagementPage } from "../pages/admin/UserManagementPage";
import { WorkerPage } from "../pages/trabajador/WorkerPage";
import { WorkerReservationsPage } from "../pages/trabajador/WorkerReservationsPage";
import { MyJobsPage } from "../pages/trabajador/MyJobsPage";
import { WorkOrderDetailsPage } from "../pages/trabajador/WorkOrderDetailsPage";
import { ClientPage } from "../pages/cliente/ClientPage";
import { ServiceManagementPage } from "../pages/servicios/ServiceManagementPage";
import { ProductManagementPage } from "../pages/productos/ProductManagementPage";
import { PublicServiciosPage } from "../pages/public/PublicServiciosPage";
import { PublicProductosPage } from "../pages/public/PublicProductosPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "servicios", element: <PublicServiciosPage /> },
      { path: "productos", element: <PublicProductosPage /> },
    ],
  },

  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      {
        path: "admin",
        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <AdminDashboard />
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
        path: "admin/servicios",
        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ServiceManagementPage />
          </RouteGuard>
        ),
      },

      {
        path: "admin/productos",
        element: (
          <RouteGuard allowedRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ProductManagementPage />
          </RouteGuard>
        ),
      },

      {
        path: "worker",
        element: (
          <RouteGuard allowedRoles={[ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <WorkerPage />
          </RouteGuard>
        ),
      },

      {
        path: "worker/reservations",
        element: (
          <RouteGuard allowedRoles={[ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <WorkerReservationsPage />
          </RouteGuard>
        ),
      },

      {
        path: "worker/jobs",
        element: (
          <RouteGuard allowedRoles={[ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <MyJobsPage />
          </RouteGuard>
        ),
      },

      {
        path: "work-orders/:id",
        element: (
          <RouteGuard allowedRoles={[ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <WorkOrderDetailsPage />
          </RouteGuard>
        ),
      },

      {
        path: "client",
        element: (
          <RouteGuard allowedRoles={[ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}>
            <ClientPage />
          </RouteGuard>
        ),
      },
    ],
  },
]);
