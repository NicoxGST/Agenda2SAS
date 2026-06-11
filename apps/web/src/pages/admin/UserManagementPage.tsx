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
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

const rolePillClass: Record<string, string> = {
  [ROLES.SUPER_ADMIN]: "pill-orange",
  [ROLES.ADMIN]:       "pill-blue",
  [ROLES.WORKER]:      "pill-success",
  [ROLES.CLIENT]:      "pill-muted",
};

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
        if (!ignore) setUsers(data);
      } catch (err: unknown) {
        if (!ignore) setError(getErrorMessage(err));
      }
    }

    void loadInitialUsers();
    return () => { ignore = true; };
  }, []);

  async function handleDelete(id: number) {
    try {
      setError("");
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCreate() {
    try {
      setError("");
      const newUser = await createUser({ name, email, password, role });
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
      if (!newRole) return;
      const updatedUser = await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  const admins  = users.filter((u) => u.role === ROLES.ADMIN || u.role === ROLES.SUPER_ADMIN);
  const workers = users.filter((u) => u.role === ROLES.WORKER);
  const clients = users.filter((u) => u.role === ROLES.CLIENT);

  function canEditRole(target: User) {
    if (!currentUser) return false;
    if (currentUser.id === target.id) return false;
    if (currentUser.role === ROLES.SUPER_ADMIN) return true;
    if (currentUser.role === ROLES.ADMIN) return target.role !== ROLES.SUPER_ADMIN;
    return false;
  }

  function availableRoles() {
    if (currentUser?.role === ROLES.SUPER_ADMIN)
      return [ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    return [ROLES.CLIENT, ROLES.WORKER, ROLES.ADMIN];
  }

  function renderGroup(title: string, list: User[], dotClass: string) {
    return (
      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">{title}</h3>
          <span className="pill pill-muted db-pill-sm">
            {list.length} usuario{list.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="db-card-body">
          <div className="list">
            {list.length === 0 && (
              <div className="empty-state">No hay usuarios en esta categoría.</div>
            )}

            {list.map((user) => (
              <article className="item-row" key={user.id}>
                <div className="item-main">
                  <div className="db-row db-row-flush">
                    <div className={`db-row-dot ${dotClass}`} />
                    <div className="db-row-body">
                      <p>{user.name}</p>
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="item-metrics">
                  {canEditRole(user) ? (
                    <label className="field">
                      <span>Rol</span>
                      <select
                        value={roleChanges[user.id] ?? user.role}
                        onChange={(e) =>
                          setRoleChanges((prev) => ({ ...prev, [user.id]: e.target.value }))
                        }
                      >
                        {availableRoles().map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <span className={`pill ${rolePillClass[user.role] ?? "pill-muted"}`}>
                      {user.role}
                    </span>
                  )}
                </div>

                <div className="actions">
                  {canEditRole(user) && (
                    <>
                      <button
                        className="button button-secondary button-small"
                        onClick={() => handleRoleUpdate(user.id)}
                        type="button"
                      >
                        Guardar rol
                      </button>
                      <button
                        className="button button-danger button-small"
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
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="db-welcome">
        <span className="db-welcome-tag">Administración</span>
        <h2>Gestión de usuarios</h2>
        <p>Crea cuentas internas y administra permisos según jerarquía de roles.</p>
      </div>

      <div className="db-card db-card-mb">
        <div className="db-card-header">
          <h3 className="db-card-title">Nuevo usuario</h3>
        </div>
        <div className="db-card-body">
          <div className="form-grid">
            <label className="field">
              <span>Nombre</span>
              <input
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
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

          <div className="actions actions-mt">
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
      </div>

      {renderGroup("Administradores", admins, "db-dot-blue")}
      {renderGroup("Trabajadores", workers, "db-dot-green")}
      {renderGroup("Clientes", clients, "db-dot-orange")}
    </>
  );
}
