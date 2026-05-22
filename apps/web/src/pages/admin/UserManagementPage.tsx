import { useEffect, useState, } from 'react';
import { getUsers, deleteUser, createUser, updateUserRole, } from '../../services/users.service';
import { useAuth } from '../../store/auth.store';
import { ROLES } from '../../constants/roles';

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

export function UserManagementPage() {
  const [users, setUsers] =
    useState<User[]>([]);

  const [roleChanges, setRoleChanges] =
    useState<
      Record<number, string>
    >({});

  const [error, setError] =
    useState('');

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [role, setRole] =
    useState(ROLES.CLIENT);
  
  const auth =
    useAuth();

  const currentUser =
    auth.user;
    
  async function loadUsers() {
    try {
      setError('');

      const data =
        await getUsers();

      setUsers(data);

    } catch (err: any) {
      setError(
        err.message,
      );
    }
  }

  async function handleDelete(
    id: number,
  ) {
    try {
      setError('');

      await deleteUser(id);

      setUsers((prev) =>
        prev.filter(
          (user) =>
            user.id !== id,
        ),
      );

    } catch (err: any) {
      setError(
        err.message,
      );
    }
  }

  async function handleCreate() {
    try {
      setError('');

      const newUser =
        await createUser({
          name,
          email,
          password,
          role,
        });

      setUsers([
        ...users,
        newUser,
      ]);

      setName('');
      setEmail('');
      setPassword('');
      setRole('CLIENT');

    } catch (err: any) {
      setError(
        err.message,
      );
    }
  }

  async function handleRoleUpdate(
    userId: number,
  ) {
    try {
      setError('');

      const newRole =
        roleChanges[userId];

      if (!newRole) {
        return;
      }

      const updatedUser =
        await updateUserRole(
          userId,
          newRole,
        );

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? updatedUser
            : user,
        ),
      );

    } catch (err: any) {
      setError(
        err.message,
      );
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const admins =
    users.filter(
      (user) =>
        user.role ===
          ROLES.ADMIN ||
        user.role ===
          ROLES.SUPER_ADMIN,
    );

  const workers =
    users.filter(
      (user) =>
        user.role ===
          ROLES.WORKER,
    );

  const clients =
    users.filter(
      (user) =>
        user.role ===
          ROLES.CLIENT,
    );


  function canEditRole(
    target: User,
  ) {
    if (!currentUser) {
      return false;
    }

    if (
      currentUser.id ===
      target.id
    ) {
      return false;
    }

    if (
      currentUser.role ===
      ROLES.SUPER_ADMIN
    ) {
      return true;
    }

    if (
      currentUser.role ===
      ROLES.ADMIN
    ) {
      return (
        target.role !==
        ROLES.SUPER_ADMIN
      );
    }

    return false;
  }

  function availableRoles() {
    if (
      currentUser?.role ===
      ROLES.SUPER_ADMIN
    ) {
      return [
        ROLES.CLIENT,
        ROLES.WORKER,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN,
      ];
    }

    return [
      ROLES.CLIENT,
      ROLES.WORKER,
      ROLES.ADMIN,
    ];
  }
  
  function renderUsers(
    title: string,
    list: User[],
  ) {
    return (
      <div>
        <h2>{title}</h2>

        {list.map(
          (user) => (
            <div key={user.id}>
              {user.name}
              {' - '}

              {canEditRole(
                user,
              ) ? (
                <>
                  <select
                    value={
                      roleChanges[
                        user.id
                      ] ??
                      user.role
                    }
                    onChange={(e) =>
                      setRoleChanges(
                        (prev) => ({
                          ...prev,

                          [user.id]:
                            e.target
                              .value,
                        }),
                      )
                    }
                  >
                    {availableRoles().map(
                      (role) => (
                        <option
                          key={role}
                          value={role}
                        >
                          {role}
                        </option>
                      ),
                    )}
                  </select>

                  <button
                    onClick={() =>
                      handleRoleUpdate(
                        user.id,
                      )
                    }
                  >
                    Guardar
                  </button>
                </>
              ) : (
                user.role
              )}
            </div>
          ),
        )}
      </div>
    );
  }

  return (
    <div>
      <h1>
        Gestión Usuarios
      </h1>

      <div>
        <input
          placeholder="nombre"
          value={name}
          onChange={(e) =>
            setName(
              e.target.value,
            )
          }
        />

        <input
          placeholder="email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value,
            )
          }
        />

        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value,
            )
          }
        />

        <select
          value={role}
          onChange={(e) =>
            setRole(
              e.target.value,
            )
          }
        >
          <option value="CLIENT">
            Cliente
          </option>

          <option value="WORKER">
            Trabajador/a
          </option>

          <option value="ADMIN">
            Administrador/a
          </option>
        </select>

        <button
          onClick={
            handleCreate
          }
        >
          + Crear Usuario
        </button>
      </div>

      {error && (
        <p>{error}</p>
      )}

      {renderUsers(
        'Administradores',
        admins,
      )}

      {renderUsers(
        'Trabajadores',
        workers,
      )}

      {renderUsers(
        'Clientes',
        clients,
      )}
    </div>
  );
}