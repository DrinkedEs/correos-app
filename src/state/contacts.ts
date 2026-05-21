const KEY = "correos.contacts.v1";
const MAX = 200;

function normalize(email: string): string {
  return email.trim().toLowerCase();
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function loadContacts(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as string[]) : [];
  } catch {
    return [];
  }
}

export function saveContacts(list: string[]): void {
  const dedup = Array.from(new Set(list.map(normalize)));
  localStorage.setItem(KEY, JSON.stringify(dedup.slice(0, MAX)));
}

export function addContactsFromCsv(...csvLists: Array<string | undefined>): void {
  const current = loadContacts();
  const incoming: string[] = [];
  for (const csv of csvLists) {
    if (!csv) continue;
    for (const part of csv.split(/[,;\s]+/)) {
      const v = normalize(part);
      if (v && isEmail(v)) incoming.push(v);
    }
  }
  if (incoming.length === 0) return;
  saveContacts([...incoming, ...current]);
}

export function removeContact(email: string): string[] {
  const next = loadContacts().filter((e) => e !== normalize(email));
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
  const all = loadContacts();
  const out: string[] = [];
  for (const c of all) {
    if (excludeSet.has(c)) continue;
    if (!q || c.includes(q)) out.push(c);
    if (out.length >= limit) break;
  }
  return out;
}

export function parseCsv(csv: string): string[] {
  return csv
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function joinCsv(list: string[]): string {
  return list.join(", ");
}
