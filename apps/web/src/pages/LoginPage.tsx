import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { login } from '../services/auth.service';
import { authStore } from '../store/auth.store';
import { parseJwt } from '../services/jwt';

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleLogin() {
    try {
      setError('');

      const data = await login(email, password);

      const user = parseJwt(data.accessToken);

      authStore.set({
        accessToken: data.accessToken,
        user: {
          email: user.email,
          role: user.role,
        },
      });

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h1>Login</h1>

      <input
        type="email"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>
        Entrar
      </button>

      {error && <p>{error}</p>}
    </div>
  );
}