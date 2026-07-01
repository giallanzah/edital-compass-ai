// Mock admin authentication for the Fomenta.ai backoffice.
// NOTE: wireframe-level auth using localStorage. Independent from company auth.

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "VIEWER";

export type AdminSession = {
  email: string;
  name: string;
  role: AdminRole;
  loggedAt: string;
};

type SeedUser = { email: string; password: string; name: string; role: AdminRole };

const SEED: SeedUser[] = [
  { email: "admin@fomenta.ai", password: "admin123", name: "Hugo Giallanza", role: "SUPER_ADMIN" },
  { email: "ana@fomenta.ai", password: "ana123", name: "Ana Martins", role: "ADMIN" },
  { email: "viewer@fomenta.ai", password: "viewer123", name: "João Viewer", role: "VIEWER" },
];

const SESSION_KEY = "fomenta.admin.session";
const AUDIT_KEY = "fomenta.admin.audit";

export function adminLogin(email: string, password: string): AdminSession {
  const u = SEED.find(
    (s) => s.email.toLowerCase() === email.toLowerCase() && s.password === password,
  );
  if (!u) throw new Error("Credenciais inválidas.");
  const session: AdminSession = {
    email: u.email,
    name: u.name,
    role: u.role,
    loggedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  logAudit(session.email, "login", `Login efetuado como ${u.role}`);
  return session;
}

export function adminLogout() {
  const s = getAdminSession();
  if (s) logAudit(s.email, "logout", "Sessão encerrada");
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function hasAdminAccess(role?: AdminRole | null) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export type AuditEntry = {
  ts: string;
  actor: string;
  action: string;
  detail: string;
};

export function logAudit(actor: string, action: string, detail: string) {
  if (typeof window === "undefined") return;
  const entry: AuditEntry = { ts: new Date().toISOString(), actor, action, detail };
  const list = getAuditLog();
  list.unshift(entry);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list.slice(0, 200)));
}

export function getAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(AUDIT_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AuditEntry[];
  } catch {
    return [];
  }
}
