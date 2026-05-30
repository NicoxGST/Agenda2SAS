import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { register } from "../services/auth.service";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrio un error";
}

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

  return (
    <section className="auth-wrap">
      <div className="panel auth-card">
        <div className="panel-body">
          <div>
            <p className="eyebrow">Nueva cuenta</p>
            <h1>Registro</h1>
            <p className="page-copy">
              Crea una cuenta cliente. Los permisos administrativos se gestionan
              desde usuarios.
            </p>
          </div>

          <label className="field">
            <span>Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

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
              autoComplete="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button className="button button-primary" onClick={handleRegister}>
            Crear cuenta
          </button>

          <Link className="button button-ghost" to="/login">
            Ya tengo cuenta
          </Link>

          {error && <p className="alert alert-error">{error}</p>}
          {success && <p className="alert alert-success">{success}</p>}
        </div>
      </div>
    </section>
  );
}
