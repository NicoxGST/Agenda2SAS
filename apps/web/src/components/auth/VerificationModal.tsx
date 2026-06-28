import { useEffect, useRef, useState } from "react";
import { verifyEmail, resendVerificationCode } from "../../services/auth.service";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocurrió un error";
}

interface Props {
  email: string;
  onSuccess: () => void;
}

export function VerificationModal({ email, onSuccess }: Props) {
  const [code, setCode]         = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startCooldown();
    return () => clearInterval(intervalRef.current!);
  }, []);

  function startCooldown() {
    setCooldown(60);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleVerify() {
    if (code.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await verifyEmail(email, code);
      setSuccess("¡Correo verificado! Redirigiendo…");
      setTimeout(onSuccess, 1500);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setError("");
      await resendVerificationCode(email);
      startCooldown();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") void handleVerify();
  }

  return (
    <div className="vm-overlay">
      <div className="vm-card">
        <div className="vm-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="vm-icon">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <div className="vm-header">
          <h2 className="vm-title">Verifica tu correo</h2>
          <p className="vm-subtitle">
            Enviamos un código de 6 dígitos a<br />
            <strong>{email}</strong>
          </p>
        </div>

        <label className="field">
          <span>Código de verificación</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={handleKeyDown}
            className="vm-code-input"
          />
        </label>

        <button
          className="button button-primary"
          onClick={handleVerify}
          disabled={loading}
          type="button"
        >
          {loading ? "Verificando…" : "Verificar cuenta"}
        </button>

        <button
          className="button button-ghost vm-resend-btn"
          onClick={handleResend}
          disabled={cooldown > 0}
          type="button"
        >
          {cooldown > 0 ? `Reenviar código en ${cooldown}s` : "Reenviar código"}
        </button>

        {error   && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}
      </div>
    </div>
  );
}
