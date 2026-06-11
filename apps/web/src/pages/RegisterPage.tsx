import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../services/auth.service";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

const steps = [
  { num: "1", label: "Ingresa tu nombre completo." },
  { num: "2", label: "Escribe un correo electrónico válido." },
  { num: "3", label: "Crea una contraseña segura y haz clic en Crear cuenta." },
];

export function RegisterPage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister() {
    try {
      setError("");
      setSuccess("");

      await register(name, email, password);

      setSuccess("Usuario creado");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleRegister();
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-brand">
          <img src="/logo.jpeg" alt="LinaresTech" className="brand-logo" />
        </div>

        <div className="auth-left-copy">
          <h2>¿Cómo crear una cuenta?</h2>
          <p>Sigue estos pasos para registrarte.</p>
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
              <p className="eyebrow">Nueva cuenta</p>
              <h1 className="auth-form-title">Registro</h1>
            </div>

            <label className="field">
              <span>Nombre</span>
              <input
                autoComplete="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>

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
                autoComplete="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </label>

            <button
              className="button button-primary"
              onClick={handleRegister}
              type="button"
            >
              Crear cuenta
            </button>

            <Link className="button button-ghost" to="/login">
              Ya tengo cuenta
            </Link>

            {error && <p className="alert alert-error">{error}</p>}
            {success && <p className="alert alert-success">{success}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
