const KEY = "correos.contacts.v2";
const LEGACY_KEY = "correos.contacts.v1";
const GROUPS_KEY = "correos.groups.v1";
const MAX = 300;

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type Contact = { email: string; uses: number; lastUsed: number };
export type ContactGroup = { id: string; name: string; emails: string[] };

export function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Contact[];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? "[]") as string[];
    return legacy.map((email) => ({ email: normalize(email), uses: 0, lastUsed: 0 }));
  } catch {
    return [];
  }
}

function saveContacts(list: Contact[]): void { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); }

export function addContactsFromCsv(...csvLists: Array<string | undefined>): void {
  const now = Date.now();
  const map = new Map(loadContacts().map((c) => [c.email, c]));
  for (const csv of csvLists) {
    if (!csv) continue;
    for (const part of csv.split(/[,;\s]+/)) {
      const v = normalize(part);
      if (v && isEmail(v)) {
        const old = map.get(v);
        map.set(v, { email: v, uses: (old?.uses ?? 0) + 1, lastUsed: now });
      }
    }
  }
  saveContacts([...map.values()].sort((a, b) => b.uses - a.uses || b.lastUsed - a.lastUsed));
}

export function removeContact(email: string): Contact[] {
  const next = loadContacts().filter((e) => e.email !== normalize(email));
  saveContacts(next);
  return next;
}

export function clearContacts(): void {
  localStorage.removeItem(KEY);
}

export function suggestContacts(
  query: string,
  exclude: string[],
  limit = 8
): string[] {
  const q = normalize(query);
  const excludeSet = new Set(exclude.map(normalize));
  const all = loadContacts().sort((a, b) => b.uses - a.uses || b.lastUsed - a.lastUsed);
  const out: string[] = [];
  for (const c of all) {
    if (excludeSet.has(c.email)) continue;
    if (!q || c.email.includes(q)) out.push(c.email);
    if (out.length >= limit) break;
  }
  return out;
}

export function loadGroups(): ContactGroup[] { try { return JSON.parse(localStorage.getItem(GROUPS_KEY) ?? "[]"); } catch { return []; } }
export function saveGroup(name: string, emails: string[], id?: string): ContactGroup {
  const group = { id: id ?? crypto.randomUUID(), name: name.trim(), emails: [...new Set(emails.map(normalize).filter(isEmail))] };
  const next = [...loadGroups().filter((g) => g.id !== group.id), group].filter((g) => g.name && g.emails.length);
  localStorage.setItem(GROUPS_KEY, JSON.stringify(next)); return group;
}
export function deleteGroup(id: string): void { localStorage.setItem(GROUPS_KEY, JSON.stringify(loadGroups().filter((g) => g.id !== id))); }

export function parseCsv(csv: string): string[] {
  return csv
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function joinCsv(list: string[]): string {
  return list.join(", ");
}
