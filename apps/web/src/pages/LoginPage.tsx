import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ROLES } from "../constants/roles";
import { login, getMe } from "../services/auth.service";
import { setAuth } from "../store/auth.store";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

const steps = [
  { num: "1", label: "Ingresa tu correo electrónico registrado." },
  { num: "2", label: "Escribe tu contraseña." },
  { num: "3", label: "Haz clic en Entrar para acceder a tu panel." },
];

export function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setError("");
      setLoading(true);

      const data = await login(email, password);
      const user = await getMe(data.accessToken);

      setAuth(data.accessToken, data.refreshToken, user);

      if (user.role === ROLES.CLIENT) {
        navigate("/client");
        return;
      }

      if (user.role === ROLES.WORKER) {
        navigate("/worker");
        return;
      }

      navigate("/admin");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleLogin();
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-brand">
          <img src="/logo.jpeg" alt="LinaresTech" className="brand-logo" />
        </div>

        <div className="auth-left-copy">
          <h2>¿Cómo iniciar sesión?</h2>
          <p>Sigue estos pasos para acceder a tu panel.</p>
        </div>

        <div className="auth-left-features">
          {steps.map((s) => (
            <div key={s.num} className="auth-left-feature">
              <div className="auth-feature-icon auth-step-num">{s.num}</div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="panel-body">
            <div>
              <p className="eyebrow">Acceso seguro</p>
              <h1 className="auth-form-title">Iniciar sesión</h1>
              <p className="auth-form-subtitle">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <label className="field">
              <span>Correo electrónico</span>
              <input
                autoComplete="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>

            <label className="field">
              <span>Contraseña</span>
              <input
                autoComplete="current-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>

            <div className="auth-forgot">
              <button type="button" className="auth-forgot-btn">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              className="button button-primary"
              disabled={loading}
              onClick={handleLogin}
              type="button"
            >
              {loading ? "Ingresando…" : "Entrar"}
            </button>

            <Link className="button button-ghost" to="/register">
              Crear cuenta nueva
            </Link>

            {error && <p className="alert alert-error">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
