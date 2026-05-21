import { useEffect, useState } from "react";
import SmtpConfig from "./components/SmtpConfig";
import Compose from "./components/Compose";
import FileDrop from "./components/FileDrop";
import Preview from "./components/Preview";
import EmailHelp from "./components/EmailHelp";
import { sendEmail, type SmtpCreds, type SendResult } from "./api/sendEmail";
import {
  clearPass,
  clearProfile,
  loadPass,
  loadProfile,
  saveProfile,
  savePass
} from "./state/session";
import { addContactsFromCsv } from "./state/contacts";

const EMPTY_CREDS: SmtpCreds = {
  smtpHost: "",
  smtpPort: 465,
  smtpUser: "",
  smtpPass: "",
  fromName: ""
};

const EMPTY_MSG = {
  to: "",
  cc: "",
  bcc: "",
  subject: "",
  html: ""
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "ok"; result: SendResult }
  | { kind: "err"; message: string };

function buildCidContext(files: File[]): string {
  if (files.length === 0) return "";
  const lines = files
    .map(
      (f) =>
        `- ${f.name} → usar <img src="cid:${f.name}" alt="..." style="display:block;border:0;" />`
    )
    .join("\n");
  return `Imágenes inline disponibles (referencia con cid:NOMBRE):\n${lines}`;
}

export default function App() {
  const [creds, setCreds] = useState<SmtpCreds>(EMPTY_CREDS);
  const [rememberPass, setRememberPass] = useState(false);
  const [msg, setMsg] = useState(EMPTY_MSG);
  const [inlineImages, setInlineImages] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const profile = loadProfile();
    const pass = loadPass();
    if (profile || pass) {
      setCreds((prev) => ({
        ...prev,
        ...(profile ?? {}),
        smtpPass: pass ?? prev.smtpPass
      }));
      if (pass) setRememberPass(true);
    }
  }, []);

  useEffect(() => {
    const { smtpPass, ...profile } = creds;
    void smtpPass;
    saveProfile(profile);
  }, [creds]);

  useEffect(() => {
    if (rememberPass) {
      if (creds.smtpPass) savePass(creds.smtpPass);
    } else {
      clearPass();
    }
  }, [rememberPass, creds.smtpPass]);

  function handleRememberPass(v: boolean) {
    setRememberPass(v);
    if (!v) clearPass();
  }

  function handleClear() {
    setCreds(EMPTY_CREDS);
    clearProfile();
    clearPass();
    setRememberPass(false);
  }

  function validate(): string | null {
    if (!creds.smtpHost) return "Falta SMTP host.";
    if (!creds.smtpPort) return "Falta SMTP port.";
    if (!creds.smtpUser) return "Falta usuario SMTP.";
    if (!creds.smtpPass) return "Falta password SMTP.";
    if (!msg.to.trim()) return "Falta destinatario (Para).";
    if (!msg.subject.trim()) return "Falta asunto.";
    if (!msg.html.trim()) return "Falta HTML.";
    return null;
  }

  async function handleSend() {
    const err = validate();
    if (err) {
      setStatus({ kind: "err", message: err });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const result = await sendEmail(creds, {
        to: msg.to,
        cc: msg.cc || undefined,
        bcc: msg.bcc || undefined,
        subject: msg.subject,
        html: msg.html,
        inlineImages,
        attachments
      });
      addContactsFromCsv(msg.to, msg.cc, msg.bcc);
      setStatus({ kind: "ok", result });
    } catch (e: any) {
      setStatus({ kind: "err", message: e?.message ?? "Error desconocido" });
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">Correos SMTP</div>
        <div className="sub">Envío de HTML vía tu propio servidor</div>
      </header>

      <div className="layout">
        <div className="col-left">
          <SmtpConfig
            creds={creds}
            remember={rememberPass}
            onChange={setCreds}
            onRememberChange={handleRememberPass}
            onClear={handleClear}
          />

          <EmailHelp
            onUseTemplate={(html) => setMsg((m) => ({ ...m, html }))}
          />

          <Compose value={msg} onChange={setMsg} />

          <FileDrop
            label="Imágenes inline"
            hint='Súbelas y referencia con <img src="cid:NOMBRE" /> en el HTML. Usa "Copiar nombres pa Claude" para pegar contexto.'
            files={inlineImages}
            accept="image/*"
            onChange={setInlineImages}
            renderItemHint={(f) => `cid:${f.name}`}
            copyForClaude={buildCidContext}
          />

          <FileDrop
            label="Adjuntos"
            hint="Excel, PDF, etc. — no se referencian en el HTML."
            files={attachments}
            onChange={setAttachments}
          />

          <div className="actions">
            <button
              type="button"
              className="primary"
              disabled={status.kind === "sending"}
              onClick={handleSend}
            >
              {status.kind === "sending" ? "Enviando..." : "Enviar correo"}
            </button>
          </div>

          {status.kind === "ok" ? (
            <div className="card status ok">
              <b>Enviado.</b>
              <div>messageId: {status.result.messageId}</div>
              <div>Aceptados: {status.result.accepted.join(", ") || "—"}</div>
              <div>Rechazados: {status.result.rejected.join(", ") || "—"}</div>
            </div>
          ) : null}

          {status.kind === "err" ? (
            <div className="card status err">
              <b>Error:</b> {status.message}
            </div>
          ) : null}
        </div>

        <aside className="col-right">
          <Preview html={msg.html} inlineImages={inlineImages} />
        </aside>
      </div>

      <footer className="app-footer">
        Host/correo se guardan localmente en este browser. Password solo en
        memoria (o sesión opt-in). Nada se persiste en el servidor.
      </footer>
    </div>
  );
}
