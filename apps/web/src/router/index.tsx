import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';

import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { RouteGuard } from '../components/auth/RouteGuard';
import { ROLES } from '../constants/roles';

import { AdminPage } from '../pages/admin/AdminPage';
import { WorkerPage } from '../pages/trabajador/WorkerPage';
import { ClientPage } from '../pages/cliente/ClientPage';

export const router =
  createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,

      children: [
        {
          index: true,
          element: <HomePage />,
        },

        {
          path: 'login',
          element: <LoginPage />,
        },

        {
          path: 'register',
          element: <RegisterPage />,
        },

        {
          path: ROLES.ADMIN,

          element: (
            <RouteGuard
              allowedRoles={[
                ROLES.ADMIN,
                ROLES.SUPER_ADMIN,
              ]}
            >
              <AdminPage />
            </RouteGuard>
          ),
        },

        {
          path: ROLES.WORKER,

          element: (
            <RouteGuard
              allowedRoles={[
                ROLES.WORKER,
                ROLES.ADMIN,
                ROLES.SUPER_ADMIN,
              ]}
            >
              <WorkerPage />
            </RouteGuard>
          ),
        },

        {
          path: ROLES.CLIENT,

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