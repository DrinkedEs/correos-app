import type { SmtpCreds } from "../api/sendEmail";

const KEY = "correos.smtp.v1";

export function loadCreds(): SmtpCreds | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SmtpCreds;
  } catch {
    return null;
  }
}

export function saveCreds(c: SmtpCreds): void {
  sessionStorage.setItem(KEY, JSON.stringify(c));
}

export function clearCreds(): void {
  sessionStorage.removeItem(KEY);
}
