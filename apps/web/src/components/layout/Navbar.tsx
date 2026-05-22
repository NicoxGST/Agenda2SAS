import { Link, useNavigate, } from 'react-router-dom';
import { useState, } from 'react';
import { useAuth, logout, } from '../../store/auth.store';
import { logoutRequest, } from '../../services/auth.service';
import { ROLES } from '../../constants/roles';

type MenuItem = {
  to: string;
  label: string;
};

const roleMenus:
  Record<
    string,
    MenuItem[]
  > = {
  [ROLES.CLIENT]: [
    {
      to: '/client',
      label:
        'Mi Panel',
    },
  ],

  [ROLES.WORKER]: [
    {
      to: '/worker',
      label:
        'Gestor',
    },
  ],

  [ROLES.ADMIN]: [
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

  [ROLES.SUPER_ADMIN]: [
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

  async function handleLogout() {

    try {

      if (auth.accessToken) {
        await logoutRequest(
          auth.accessToken,
        );
      }

    } catch (err) {

      console.error(
        'Logout request failed',
        err,
      );

    } finally {

      logout();

      navigate('/');
    }
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