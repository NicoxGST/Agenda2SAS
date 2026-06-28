import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../services/auth.service";
import { VerificationModal } from "../components/auth/VerificationModal";

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

  const [name, setName]                 = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [error, setError]               = useState("");
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    try {
      setError("");
      await register(name, email, password);
      setPendingEmail(email);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleRegister();
  }

  return (
    <>
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-brand">
          <Link to="/">
            <img src="/logo.jpeg" alt="LinaresTech" className="brand-logo" />
          </Link>
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
              <div className="password-wrap">
                <input
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <button type="button" className="password-eye" onClick={() => setShowPassword((v) => !v)}>
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
          </div>
        </div>
      </div>
    </div>

    {pendingEmail && (
      <VerificationModal
        email={pendingEmail}
        onSuccess={() => navigate("/login")}
      />
    )}
    </>
  );
}
