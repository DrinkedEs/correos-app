import { useEffect, useState } from "react";
import SmtpConfig from "./components/SmtpConfig";
import Compose from "./components/Compose";
import FileDrop from "./components/FileDrop";
import InlineImagesCard from "./components/InlineImagesCard";
import Preview from "./components/Preview";
import EmailHelp from "./components/EmailHelp";
import {
  sendEmail,
  type InlineImage,
  type SmtpCreds,
  type SendResult
} from "./api/sendEmail";
import {
  clearPass,
  clearProfile,
  loadPass,
  loadProfile,
  saveProfile,
  savePass
} from "./state/session";
import { addContactsFromCsv } from "./state/contacts";
import GroupsCard from "./components/GroupsCard";
import Inbox, { type MailCredentials, type OpenMessage } from "./components/Inbox";
import { builtInImages, signatureHtml } from "./state/builtInAssets";

const EMPTY_CREDS: SmtpCreds = {
  smtpHost: "smtp.exmail.qq.com",
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

export default function App() {
  const [creds, setCreds] = useState<SmtpCreds>(EMPTY_CREDS);
  const [rememberPass, setRememberPass] = useState(false);
  const [msg, setMsg] = useState(EMPTY_MSG);
  const [inlineImages, setInlineImages] = useState<InlineImage[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [reply, setReply] = useState<{ inReplyTo: string; references: string; originalHtml: string; originalSubject: string } | null>(null);
  const [reading, setReading] = useState<OpenMessage | null>(null);

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
      const finalHtml = reply ? composeReplyHtml(msg.html, reply.originalHtml) : msg.html;
      const result = await sendEmail(creds, {
        to: msg.to,
        cc: msg.cc || undefined,
        bcc: msg.bcc || undefined,
        subject: msg.subject,
        html: finalHtml,
        inlineImages,
        attachments,
        inReplyTo: reply?.inReplyTo,
        references: reply?.references
      });
      addContactsFromCsv(msg.to, msg.cc, msg.bcc);
      setStatus({ kind: "ok", result });
    } catch (e: any) {
      setStatus({ kind: "err", message: e?.message ?? "Error desconocido" });
    }
  }

  const previewHtml = reply ? composeReplyHtml(msg.html, reply.originalHtml) : msg.html;

  async function insertSignature() {
    try {
      const images = await builtInImages();
      setInlineImages((old) => [...old.filter((x) => !images.some((i) => i.cid === x.cid)), ...images]);
      setMsg((m) => ({ ...m, html: m.html.includes("cid:firma@correos.local") ? m.html : `${m.html}${signatureHtml}` }));
    } catch { setStatus({ kind: "err", message: "No se pudieron cargar los recursos de firma." }); }
  }

  function replyTo(mail: OpenMessage, all = false) {
    const own = creds.smtpUser.trim().toLowerCase();
    const unique = (list: { address: string }[]) => Array.from(new Set(list.map((x) => x.address.trim().toLowerCase()).filter((address) => address && address !== own)));
    const to = all ? unique([mail.from, ...mail.to]) : unique([mail.from]);
    const cc = all ? unique(mail.cc).filter((address) => !to.includes(address)) : [];
    setMsg({ to: to.join(", "), cc: cc.join(", "), bcc: "", subject: /^re:/i.test(mail.subject) ? mail.subject : `Re: ${mail.subject}`, html: "<p><br></p>" });
    setReply({ inReplyTo: mail.messageId, references: mail.messageId, originalHtml: mail.html, originalSubject: mail.subject });
    setReading(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const mailboxCreds: MailCredentials = { imapUser: creds.smtpUser, imapPass: creds.smtpPass, imapHost: "imap.exmail.qq.com", imapPort: 993 };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">Correos SMTP</div>
        <div className="sub">Envío de HTML vía tu propio servidor</div>
      </header>

      <div className="mail-workspace">
        <aside className="mail-sidebar">
          <Inbox creds={mailboxCreds} onOpenMessage={setReading} />
        </aside>
        <main className="mail-main">
          {reading ? <section className="card reader-card"><div className="card-head"><div><h2>{reading.subject}</h2><p className="hint">{reading.from.name || reading.from.address} · {reading.date && new Date(reading.date).toLocaleString()}</p></div><div className="reply-actions"><button type="button" className="ghost small" onClick={() => replyTo(reading)}>Responder</button><button type="button" className="primary small" onClick={() => replyTo(reading, true)}>Responder a todos</button><button type="button" className="ghost small" onClick={() => setReading(null)}>Cerrar</button></div></div><iframe title="Correo recibido" sandbox="allow-popups" srcDoc={reading.html} /></section> : null}
          <div className="composer-controls">
            <div className="composer-settings">
          <SmtpConfig
            creds={creds}
            remember={rememberPass}
            onChange={setCreds}
            onRememberChange={handleRememberPass}
            onClear={handleClear}
          />
          <GroupsCard onPick={(emails) => setMsg((m) => ({ ...m, to: Array.from(new Set([...m.to.split(/[,;]+/).map(x => x.trim()).filter(Boolean), ...emails])).join(", ") }))} />
            </div>
            <div className="composer-message">
          <EmailHelp
            onUseTemplate={(html) => setMsg((m) => ({ ...m, html }))}
          />

          {reply ? <div className="reply-banner"><b>Respuesta</b><span>Tu contenido se enviará arriba de: {reply.originalSubject}</span><button type="button" className="ghost small" onClick={() => setReply(null)}>Quitar respuesta</button></div> : null}
          <Compose value={msg} onChange={setMsg} htmlLabel={reply ? "HTML de la respuesta" : "HTML del correo"} />

          <div className="actions signature-actions"><button type="button" className="ghost" onClick={insertSignature}>Insertar firma y logos</button>{reply ? <button type="button" className="ghost small" onClick={() => setReply(null)}>Quitar respuesta</button> : null}</div>

          <InlineImagesCard
            images={inlineImages}
            onChange={setInlineImages}
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
          </div>
          <Preview html={previewHtml} inlineImages={inlineImages} onEditHtml={(html) => setMsg((message) => ({ ...message, html }))} />
        </main>
      </div>

      <footer className="app-footer">
        Host/correo se guardan localmente en este browser. Password solo en
        memoria (o sesión opt-in). Nada se persiste en el servidor.
      </footer>
    </div>
  );
}

function composeReplyHtml(responseHtml: string, originalHtml: string): string {
  const body = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.innerHTML || html;
  };
  return `<!doctype html><html><body><section id="correo-respuesta" style="font-family:Arial,sans-serif"><h3 style="color:#156082">Respuesta</h3>${body(responseHtml)}</section><hr style="border:0;border-top:1px solid #d7dee7;margin:28px 0"><section contenteditable="false"><p style="font:12px Arial,sans-serif;color:#64748b;margin:0 0 12px">Correo anterior</p>${body(originalHtml)}</section></body></html>`;
}
