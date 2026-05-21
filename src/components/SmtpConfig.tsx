import { useState } from "react";
import type { SmtpCreds } from "../api/sendEmail";

type Props = {
  creds: SmtpCreds;
  remember: boolean;
  onChange: (next: SmtpCreds) => void;
  onRememberChange: (v: boolean) => void;
  onClear: () => void;
};

const PRESETS: Array<{ label: string; host: string; port: number }> = [
  { label: "Custom", host: "", port: 587 },
  { label: "Gmail (app password)", host: "smtp.gmail.com", port: 587 },
  { label: "Outlook / Office 365", host: "smtp.office365.com", port: 587 },
  { label: "Exmail QQ", host: "smtp.exmail.qq.com", port: 587 },
  { label: "Zoho", host: "smtp.zoho.com", port: 587 }
];

export default function SmtpConfig({
  creds,
  remember,
  onChange,
  onRememberChange,
  onClear
}: Props) {
  const [showPass, setShowPass] = useState(false);

  function set<K extends keyof SmtpCreds>(k: K, v: SmtpCreds[K]) {
    onChange({ ...creds, [k]: v });
  }

  function applyPreset(label: string) {
    const p = PRESETS.find((x) => x.label === label);
    if (!p || !p.host) return;
    onChange({ ...creds, smtpHost: p.host, smtpPort: p.port });
  }

  return (
    <section className="card">
      <h2>Credenciales SMTP</h2>
      <p className="hint">
        Pa Gmail/Outlook usa un <b>App Password</b>, no tu password normal.
        Nada se persiste en servidor; opcional guardar en sesión del browser.
      </p>

      <div className="row">
        <label>
          Preset
          <select
            onChange={(e) => applyPreset(e.target.value)}
            defaultValue="Custom"
          >
            {PRESETS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="row two">
        <label>
          Host
          <input
            type="text"
            placeholder="smtp.example.com"
            value={creds.smtpHost}
            onChange={(e) => set("smtpHost", e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          Puerto
          <input
            type="number"
            min={1}
            max={65535}
            value={creds.smtpPort}
            onChange={(e) => set("smtpPort", Number(e.target.value))}
          />
        </label>
      </div>

      <div className="row two">
        <label>
          Usuario / Correo
          <input
            type="email"
            placeholder="tu@correo.com"
            value={creds.smtpUser}
            onChange={(e) => set("smtpUser", e.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Nombre remitente (opcional)
          <input
            type="text"
            placeholder="Tu Nombre"
            value={creds.fromName ?? ""}
            onChange={(e) => set("fromName", e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <div className="row">
        <label>
          Password
          <div className="pass-wrap">
            <input
              type={showPass ? "text" : "password"}
              value={creds.smtpPass}
              onChange={(e) => set("smtpPass", e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setShowPass((v) => !v)}
            >
              {showPass ? "Ocultar" : "Ver"}
            </button>
          </div>
        </label>
      </div>

      <div className="row inline">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => onRememberChange(e.target.checked)}
          />
          Recordar en esta sesión (sessionStorage, se borra al cerrar browser)
        </label>
        <button type="button" className="ghost" onClick={onClear}>
          Limpiar credenciales
        </button>
      </div>
    </section>
  );
}
