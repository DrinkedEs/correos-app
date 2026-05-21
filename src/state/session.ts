import type { SmtpCreds } from "../api/sendEmail";

const PROFILE_KEY = "correos.smtp.profile.v1";
const PASS_KEY = "correos.smtp.pass.v1";

type Profile = Omit<SmtpCreds, "smtpPass">;

export function loadProfile(): Profile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function saveProfile(p: Profile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

export function loadPass(): string | null {
  try {
    return sessionStorage.getItem(PASS_KEY);
  } catch {
    return null;
  }
}

export function savePass(pass: string): void {
  sessionStorage.setItem(PASS_KEY, pass);
}

export function clearPass(): void {
  sessionStorage.removeItem(PASS_KEY);
}
