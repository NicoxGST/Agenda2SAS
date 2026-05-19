import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  register,
} from '../services/auth.service';

export function RegisterPage() {
  const navigate =
    useNavigate();

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  async function handleRegister() {
    try {
      setError('');
      setSuccess('');

      await register(
        name,
        email,
        password,
      );

      setSuccess(
        'Usuario creado',
      );

      setTimeout(() => {
        navigate(
          '/login',
        );
      }, 1000);

    } catch (err: any) {
      setError(
        err.message,
      );
    }
  }

  return (
    <div>
      <h1>
        Registro
      </h1>

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

      <button
        onClick={
          handleRegister
        }
      >
        Crear cuenta
      </button>

      {error && (
        <p>{error}</p>
      )}

      {success && (
        <p>{success}</p>
      )}
    </div>
  );
}