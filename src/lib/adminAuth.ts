// Audit trail cosmético do backoffice (não é mecanismo de autenticação).
// A autenticação e autorização reais vivem no Supabase Auth + tabela `user_roles`
// (ver src/routes/admin.tsx, src/routes/admin.login.tsx e src/lib/admin.functions.ts).

export type AuditEntry = {
  ts: string;
  actor: string;
  action: string;
  detail: string;
};

const AUDIT_KEY = "fomenta.admin.audit";

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
