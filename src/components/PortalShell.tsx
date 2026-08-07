import { Link, useRouterState, Outlet, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Logo } from "./Logo";
import { supabase } from "@/integrations/supabase/client";

type Item = { to: string; label: string };

function initials(name: string, email: string) {
  const src = name?.trim() || email;
  if (!src) return "··";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || src.slice(0, 2).toUpperCase();
}

export function PortalShell({
  items,
  title,
  badge,
  rightSlot,
  session,
  alertasPrazo = 0,
}: {
  items: Item[];
  title: string;
  badge?: string;
  rightSlot?: ReactNode;
  session?: Session | null;
  alertasPrazo?: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const user = session?.user;
  const meta = (user?.user_metadata ?? {}) as { full_name?: string };
  const name = meta.full_name ?? "";
  const email = user?.email ?? "";
  const showAccount = Boolean(user);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/portal/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 hairline-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <Logo variant="compact" />
            </Link>
            <span className="hidden h-4 w-px bg-border md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <span className="eyebrow">{title}</span>
              {badge && (
                <span className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {alertasPrazo > 0 && (
              <Link
                to="/portal/candidaturas"
                title={`${alertasPrazo} candidatura(s) com prazo em ≤7 dias`}
                className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-destructive/40 bg-destructive/10 px-2 font-mono text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/15"
              >
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
                {alertasPrazo} prazo{alertasPrazo > 1 ? "s" : ""} ≤7d
              </Link>
            )}
            {rightSlot}
            {showAccount ? (
              <div className="relative">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-mono text-xs text-background"
                  aria-label="Conta"
                >
                  {initials(name, email)}
                </button>
                {open && (
                  <div
                    onMouseLeave={() => setOpen(false)}
                    className="absolute right-0 top-10 z-50 w-56 hairline bg-background p-2 shadow-lg"
                  >
                    <div className="px-2 py-2">
                      <div className="truncate text-sm font-medium">{name || email}</div>
                      {name && (
                        <div className="truncate text-xs text-muted-foreground">{email}</div>
                      )}
                    </div>
                    <hr className="my-1 border-[var(--hairline)]" />
                    <Link
                      to="/portal/perfil"
                      onClick={() => setOpen(false)}
                      className="block rounded-sm px-2 py-1.5 text-sm hover:bg-secondary"
                    >
                      Perfil da empresa
                    </Link>
                    <button
                      onClick={signOut}
                      className="block w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-secondary"
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/portal/login"
                className="inline-flex h-8 items-center rounded-sm bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Nav */}
      <nav className="hairline-b bg-background">
        <div className="mx-auto flex max-w-7xl gap-6 overflow-x-auto px-6">
          {items.map((it) => {
            const active =
              it.to === "/portal"
                ? pathname === "/portal"
                : pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
