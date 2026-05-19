import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '../services/auth.service';
import { login as saveAuth } from '../store/auth.store';

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

      saveAuth(
        data.accessToken,
      );

      const role =
        JSON.parse(
          atob(
            data.accessToken
              .split('.')[1],
          ),
        ).role;

      if (
        role === 'CLIENT'
      ) {
        navigate(
          '/client',
        );

        return;
      }

      if (
        role === 'WORKER'
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