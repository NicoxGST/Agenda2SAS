import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  useState,
} from 'react';

import {
  useAuth,
  logout,
} from '../../store/auth.store';

type MenuItem = {
  to: string;
  label: string;
};

const roleMenus:
  Record<
    string,
    MenuItem[]
  > = {
  CLIENT: [
    {
      to: '/client',
      label:
        'Mi Panel',
    },
  ],

  WORKER: [
    {
      to: '/worker',
      label:
        'Gestor',
    },
  ],

  ADMIN: [
    {
      to: '/admin',
      label:
        'Panel Admin',
    },

    {
      to: '/users',
      label:
        'Gestión',
    },
  ],

  SUPER_ADMIN: [
    {
      to: '/admin',
      label:
        'Panel Admin',
    },

    {
      to: '/users',
      label:
        'Gestión',
    },
  ],
};

export function Navbar() {
  const navigate =
    useNavigate();

  const auth =
    useAuth();

  const user =
    auth.user;

  const [open, setOpen] =
    useState(false);

  const menu =
    user
      ? roleMenus[
          user.role
        ] || []
      : [];

  function closeMenu() {
    setOpen(false);
  }

  function handleLogout() {
    logout();

    closeMenu();

    navigate('/');
  }

  return (
    <nav>
      <Link to="/">
        Inicio
      </Link>

      <button
        onClick={() =>
          setOpen(
            !open,
          )
        }
      >
        ☰
      </button>

      {open && (
        <div>
          {!user && (
            <>
              <Link
                to="/login"
                onClick={
                  closeMenu
                }
              >
                Login
              </Link>

              <Link
                to="/register"
                onClick={
                  closeMenu
                }
              >
                Registro
              </Link>
            </>
          )}

          {user && (
            <>
              {menu.map(
                (
                  item,
                ) => (
                  <Link
                    key={
                      item.to
                    }

                    to={
                      item.to
                    }

                    onClick={
                      closeMenu
                    }
                  >
                    {
                      item.label
                    }
                  </Link>
                ),
              )}

              <button
                onClick={
                  handleLogout
                }
              >
                Salir
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}