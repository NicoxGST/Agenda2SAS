import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login, getMe, } from '../services/auth.service';
import { setAuth, } from '../store/auth.store';
import { ROLES } from '../constants/roles';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setError('');

      const data = await login(
        email,
        password,
      );

      const user =
        await getMe(
          data.accessToken,
        );

      setAuth(
        data.accessToken,
        data.refreshToken,
        user,
      );

      const role =
        user.role;

      if (
        role === ROLES.CLIENT
      ) {
        navigate(
          '/client',
        );

        return;
      }

      if (
        role === ROLES.WORKER
      ) {
        navigate(
          '/worker',
        );

        return;
      }

      navigate(
        '/admin',
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <input
        type="email"
        value={email}
        onChange={(e) =>
          setEmail(
            e.target.value,
          )
        }
      />

      <input
        type="password"
        value={password}
        onChange={(e) =>
          setPassword(
            e.target.value,
          )
        }
      />

      <button
        onClick={handleLogin}
      >
        Entrar
      </button>

      {error && <p>{error}</p>}
    </div>
  );
}
