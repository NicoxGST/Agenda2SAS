import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ROLES } from "../constants/roles";
import { login, getMe } from "../services/auth.service";
import { setAuth } from "../store/auth.store";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      setError("");

      const data = await login(email, password);

      const user = await getMe(data.accessToken);

      setAuth(data.accessToken, data.refreshToken, user);

      const role = user.role;

      if (role === ROLES.CLIENT) {
        navigate("/client");
        return;
      }

      if (role === ROLES.WORKER) {
        navigate("/worker");
        return;
      }

      navigate("/admin");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section className="auth-wrap">
      <div className="panel auth-card">
        <div className="panel-body">
          <div>
            <p className="eyebrow">Acceso seguro</p>
            <h1>Login</h1>
            <p className="page-copy">
              Ingresa con tu cuenta para acceder al panel segun tu rol.
            </p>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="button button-primary" onClick={handleLogin}>
            Entrar
          </button>

          <Link className="button button-ghost" to="/register">
            Crear cuenta
          </Link>

          {error && <p className="alert alert-error">{error}</p>}
        </div>
      </div>
    </section>
  );
}
