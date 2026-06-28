import { useEffect, useRef, useState } from "react";
import { forgotPassword, resetPassword, verifyResetCode } from "../../services/auth.service";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
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
  );
}

interface Props {
  onClose: () => void;
}

type Step = "email" | "code" | "password" | "success";

export function ForgotPasswordModal({ onClose }: Props) {
  const [step, setStep]                       = useState<Step>("email");
  const [email, setEmail]                     = useState("");
  const [code, setCode]                       = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [error, setError]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [cooldown, setCooldown]               = useState(0);
  const intervalRef                           = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(intervalRef.current!), []);

  function startCooldown() {
    setCooldown(60);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSendCode() {
    if (!email) { setError("Ingresa tu correo"); return; }
    try {
      setError("");
      setLoading(true);
      await forgotPassword(email);
      startCooldown();
      setStep("code");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setError("");
      await forgotPassword(email);
      startCooldown();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  async function handleCodeNext() {
    if (code.length !== 6) { setError("El código debe tener 6 dígitos"); return; }
    try {
      setError("");
      setLoading(true);
      await verifyResetCode(email, code);
      setStep("password");
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!newPassword)                    { setError("Ingresa tu nueva contraseña"); return; }
    if (newPassword.length < 6)          { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    try {
      setError("");
      setLoading(true);
      await resetPassword(email, code, newPassword);
      setStep("success");
      setTimeout(onClose, 2500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setStep("code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="vm-overlay">
      <div className="vm-card">

        {step === "email" && (
          <>
            <div className="vm-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vm-icon">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div className="vm-header">
              <h2 className="vm-title">¿Olvidaste tu contraseña?</h2>
              <p className="vm-subtitle">Ingresa tu correo y te enviaremos un código para restablecerla.</p>
            </div>
            <label className="field vm-field">
              <span className="vm-label">Correo electrónico</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSendCode()}
                placeholder="tucorreo@email.com"
              />
            </label>
            <button className="button button-primary vm-btn" onClick={handleSendCode} disabled={loading} type="button">
              {loading ? "Enviando…" : "Enviar código"}
            </button>
            <button className="button button-ghost vm-btn" onClick={onClose} type="button">
              Cancelar
            </button>
          </>
        )}

        {step === "code" && (
          <>
            <div className="vm-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vm-icon">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="vm-header">
              <h2 className="vm-title">Ingresa el código</h2>
              <p className="vm-subtitle">Enviamos un código de 6 dígitos a<br /><strong>{email}</strong></p>
            </div>
            <label className="field vm-field">
              <span className="vm-label">Código de verificación</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && void handleCodeNext()}
                className="vm-code-input"
              />
            </label>
            <button className="button button-primary vm-btn" onClick={handleCodeNext} disabled={loading} type="button">
              {loading ? "Verificando…" : "Continuar"}
            </button>
            <button className="button button-ghost vm-btn" onClick={handleResend} disabled={cooldown > 0} type="button">
              {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
            </button>
          </>
        )}

        {step === "password" && (
          <>
            <div className="vm-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vm-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="vm-header">
              <h2 className="vm-title">Nueva contraseña</h2>
              <p className="vm-subtitle">Elige una contraseña segura de al menos 6 caracteres.</p>
            </div>
            <label className="field vm-field">
              <span className="vm-label">Nueva contraseña</span>
              <div className="password-wrap">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button type="button" className="password-eye" onClick={() => setShowNew((v) => !v)}>
                  <EyeIcon visible={showNew} />
                </button>
              </div>
            </label>
            <label className="field vm-field">
              <span className="vm-label">Confirmar contraseña</span>
              <div className="password-wrap">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleResetPassword()}
                  placeholder="••••••••"
                />
                <button type="button" className="password-eye" onClick={() => setShowConfirm((v) => !v)}>
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
            </label>
            <button className="button button-primary vm-btn" onClick={handleResetPassword} disabled={loading} type="button">
              {loading ? "Guardando…" : "Guardar contraseña"}
            </button>
          </>
        )}

        {step === "success" && (
          <>
            <div className="vm-icon-wrap vm-icon-wrap-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vm-icon vm-icon-success">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div className="vm-header">
              <h2 className="vm-title">¡Contraseña actualizada!</h2>
              <p className="vm-subtitle">Tu contraseña fue cambiada exitosamente. Serás redirigido al login en un momento.</p>
            </div>
          </>
        )}

        {error && <p className="alert alert-error vm-btn">{error}</p>}
      </div>
    </div>
  );
}
