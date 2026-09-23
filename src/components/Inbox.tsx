import { useState } from "react";
import { API_BASE } from "../config/env";

export type MailCredentials = { imapUser: string; imapPass: string; imapHost: string; imapPort: number };
type Summary = { uid: number; from: { name: string; address: string }[]; subject: string; date: string | null; seen: boolean };
export type OpenMessage = { uid: number; from: { name: string; address: string }; to: { name: string; address: string }[]; cc: { name: string; address: string }[]; subject: string; date: string | null; html: string; messageId: string };

export default function Inbox({ creds, onOpenMessage }: { creds: MailCredentials; onOpenMessage: (m: OpenMessage) => void }) {
  const [items, setItems] = useState<Summary[]>([]);
  const [offset, setOffset] = useState(0); const [total, setTotal] = useState(0); const [status, setStatus] = useState("");
  const request = async (path: string, extra = {}) => { const r = await fetch(`${API_BASE}/email/mailbox/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...creds, ...extra }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Error de bandeja"); return d; };
  async function load(next = 0) { setStatus("Cargando..."); try { const d = await request("inbox", { offset: next, limit: 50 }); setItems(next ? [...items, ...d.messages] : d.messages); setOffset(next); setTotal(d.total); setStatus(""); } catch (e: any) { setStatus(e.message); } }
  async function show(uid: number) { setStatus("Abriendo correo..."); try { const d = await request("message", { uid }); onOpenMessage(d.message); setStatus(""); } catch (e: any) { setStatus(e.message); } }
  return <section className="card inbox-card"><div className="card-head"><h2>Bandeja de entrada</h2><button type="button" className="ghost small" onClick={() => load(0)}>Actualizar</button></div><p className="hint">Exmail IMAP · la contraseña solo se usa durante esta sesión.</p>{status && <p className="inbox-status">{status}</p>}
    {!items.length ? <button type="button" className="primary" onClick={() => load(0)}>Conectar y ver correos</button> : <><div className="inbox-list">{items.map(m => <button key={m.uid} type="button" className={`mail-row ${m.seen ? "" : "unread"}`} onClick={() => show(m.uid)}><span>{m.from[0]?.name || m.from[0]?.address || "Remitente"}</span><b>{m.subject}</b><small>{m.date ? new Date(m.date).toLocaleString() : ""}</small></button>)}</div>{items.length < total && <button className="ghost small" type="button" onClick={() => load(offset + 50)}>Cargar más</button>}</>}
  </section>;
}
