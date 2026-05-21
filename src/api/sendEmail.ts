import { SEND_EMAIL_URL } from "../config/env";

export type SmtpCreds = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromName?: string;
};

export type EmailPayload = {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  inlineImages?: File[];
  attachments?: File[];
};

export type SendResult = {
  ok: true;
  messageId: string;
  accepted: string[];
  rejected: string[];
};

export async function sendEmail(
  creds: SmtpCreds,
  payload: EmailPayload
): Promise<SendResult> {
  const fd = new FormData();
  fd.append("smtpHost", creds.smtpHost);
  fd.append("smtpPort", String(creds.smtpPort));
  fd.append("smtpUser", creds.smtpUser);
  fd.append("smtpPass", creds.smtpPass);
  if (creds.fromName) fd.append("fromName", creds.fromName);

  fd.append("to", payload.to);
  if (payload.cc) fd.append("cc", payload.cc);
  if (payload.bcc) fd.append("bcc", payload.bcc);
  fd.append("subject", payload.subject);
  fd.append("html", payload.html);

  (payload.inlineImages ?? []).forEach((f) => fd.append("inline", f, f.name));
  (payload.attachments ?? []).forEach((f) => fd.append("attachments", f, f.name));

  const res = await fetch(SEND_EMAIL_URL, { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && data.error) || `HTTP ${res.status}`);
  }
  return data as SendResult;
}
