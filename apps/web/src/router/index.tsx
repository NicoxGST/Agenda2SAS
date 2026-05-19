import { createBrowserRouter } from 'react-router-dom';

import { MainLayout } from '../layouts/MainLayout';

import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';

import { RouteGuard } from '../components/layout/ProtectedRoute';

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
          path: 'admin',

          element: (
            <RouteGuard
              allowedRoles={[
                'ADMIN',
                'SUPER_ADMIN',
              ]}
            >
              <AdminPage />
            </RouteGuard>
          ),
        },

        {
          path: 'worker',

          element: (
            <RouteGuard
              allowedRoles={[
                'WORKER',
                'ADMIN',
                'SUPER_ADMIN',
              ]}
            >
              <WorkerPage />
            </RouteGuard>
          ),
        },

        {
          path: 'client',

          element: (
            <RouteGuard
              allowedRoles={[
                'CLIENT',
                'WORKER',
                'ADMIN',
                'SUPER_ADMIN',
              ]}
            >
              <ClientPage />
            </RouteGuard>
          ),
        },
      ],
    },
  ]);