import { useEffect, useState } from "react";
import SmtpConfig from "./components/SmtpConfig";
import Compose from "./components/Compose";
import FileDrop from "./components/FileDrop";
import Preview from "./components/Preview";
import { sendEmail, type SmtpCreds, type SendResult } from "./api/sendEmail";
import { clearCreds, loadCreds, saveCreds } from "./state/session";

const EMPTY_CREDS: SmtpCreds = {
  smtpHost: "",
  smtpPort: 587,
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

export default function App() {
  const [creds, setCreds] = useState<SmtpCreds>(EMPTY_CREDS);
  const [remember, setRemember] = useState(false);
  const [msg, setMsg] = useState(EMPTY_MSG);
  const [inlineImages, setInlineImages] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const loaded = loadCreds();
    if (loaded) {
      setCreds(loaded);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    if (remember) saveCreds(creds);
  }, [remember, creds]);

  function handleRememberChange(v: boolean) {
    setRemember(v);
    if (!v) clearCreds();
  }

  function handleClear() {
    setCreds(EMPTY_CREDS);
    clearCreds();
    setRemember(false);
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

      <main>
        <SmtpConfig
          creds={creds}
          remember={remember}
          onChange={setCreds}
          onRememberChange={handleRememberChange}
          onClear={handleClear}
        />

        <Compose value={msg} onChange={setMsg} />

        <FileDrop
          label="Imágenes inline"
          hint='Súbelas, después referencia con <img src="cid:NOMBRE_ARCHIVO" /> en el HTML.'
          files={inlineImages}
          accept="image/*"
          onChange={setInlineImages}
          renderItemHint={(f) => `cid:${f.name}`}
        />

        <FileDrop
          label="Adjuntos"
          hint="Excel, PDF, etc."
          files={attachments}
          onChange={setAttachments}
        />

        <div className="actions">
          <button
            type="button"
            className="ghost"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? "Ocultar preview" : "Mostrar preview"}
          </button>
          <button
            type="button"
            className="primary"
            disabled={status.kind === "sending"}
            onClick={handleSend}
          >
            {status.kind === "sending" ? "Enviando..." : "Enviar correo"}
          </button>
        </div>

        {showPreview ? (
          <Preview html={msg.html} inlineImages={inlineImages} />
        ) : null}

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
      </main>

      <footer className="app-footer">
        Tus credenciales viajan por HTTPS y no se persisten en el servidor.
      </footer>
    </div>
  );
}
