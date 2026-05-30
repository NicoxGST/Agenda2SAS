import { useEffect, useState } from "react";

import { ROLES } from "../../constants/roles";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUserRole,
} from "../../services/users.service";
import { useAuth } from "../../store/auth.store";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleChanges, setRoleChanges] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(ROLES.CLIENT);

  const auth = useAuth();
  const currentUser = auth.user;

  useEffect(() => {
    let ignore = false;

    async function loadInitialUsers() {
      try {
        setError("");

        const data = await getUsers();

        if (!ignore) {
          setUsers(data);
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(getErrorMessage(err));
        }
      }
    }

    void loadInitialUsers();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleDelete(id: number) {
    try {
      setError("");

      await deleteUser(id);

      setUsers((prev) => prev.filter((user) => user.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCreate() {
    try {
      setError("");

      const newUser = await createUser({
        name,
        email,
        password,
        role,
      });

      setUsers([...users, newUser]);

      setName("");
      setEmail("");
      setPassword("");
      setRole(ROLES.CLIENT);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleRoleUpdate(userId: number) {
    try {
      setError("");

      const newRole = roleChanges[userId];

      if (!newRole) {
        return;
      }

      const updatedUser = await updateUserRole(userId, newRole);

      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updatedUser : user)),
      );
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  const admins = users.filter(
    (user) => user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN,
  );

  const workers = users.filter((user) => user.role === ROLES.WORKER);
  const clients = users.filter((user) => user.role === ROLES.CLIENT);

  function canEditRole(target: User) {
    if (!currentUser) {
      return false;
    }

    if (currentUser.id === target.id) {
      return false;
    }

    if (currentUser.role === ROLES.SUPER_ADMIN) {
      return true;
    }

    if (currentUser.role === ROLES.ADMIN) {
      return target.role !== ROLES.SUPER_ADMIN;
    }

    return false;
  }

  function availableRoles() {
    if (currentUser?.role === ROLES.SUPER_ADMIN) {
      return [ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    }

    return [ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN];
  }

  function renderUsers(title: string, list: User[]) {
    return (
      <section className="section">
        <div className="page-header">
          <div>
            <h2>{title}</h2>
            <p className="page-copy">
              {list.length} usuario{list.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="list">
          {list.length === 0 && (
            <div className="empty-state">No hay usuarios en esta categoria.</div>
          )}

          {list.map((user) => (
            <article className="item-row" key={user.id}>
              <div className="item-main">
                <h3 className="item-title">{user.name}</h3>
                <p className="item-description">{user.email}</p>
              </div>

              <div className="item-metrics">
                {canEditRole(user) ? (
                  <label className="field">
                    <span>Rol</span>
                    <select
                      value={roleChanges[user.id] ?? user.role}
                      onChange={(e) =>
                        setRoleChanges((prev) => ({
                          ...prev,
                          [user.id]: e.target.value,
                        }))
                      }
                    >
                      {availableRoles().map((availableRole) => (
                        <option key={availableRole} value={availableRole}>
                          {availableRole}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="pill pill-blue">{user.role}</span>
                )}
              </div>

              <div className="actions">
                {canEditRole(user) && (
                  <>
                    <button
                      className="button button-secondary"
                      onClick={() => handleRoleUpdate(user.id)}
                      type="button"
                    >
                      Guardar
                    </button>

                    <button
                      className="button button-danger"
                      onClick={() => handleDelete(user.id)}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Administracion</p>
          <h1>Gestion usuarios</h1>
          <p className="page-copy">
            Crea cuentas internas y administra permisos segun jerarquia.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Nuevo usuario</h2>
        </div>

        <div className="panel-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Rol</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value={ROLES.CLIENT}>Cliente</option>
                <option value={ROLES.WORKER}>Trabajador/a</option>
                <option value={ROLES.ADMIN}>Administrador/a</option>
              </select>
            </label>
          </div>

          <div className="actions section">
            <button
              className="button button-primary"
              onClick={handleCreate}
              type="button"
            >
              Crear usuario
            </button>
          </div>

          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </section>

      {renderUsers("Administradores", admins)}
      {renderUsers("Trabajadores", workers)}
      {renderUsers("Clientes", clients)}
    </>
  );
}
