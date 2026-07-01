import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./Logo";

type Item = { to: string; label: string };

export function PortalShell({
  items,
  title,
  badge,
  rightSlot,
}: {
  items: Item[];
  title: string;
  badge?: string;
  rightSlot?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 hairline-b bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <Logo />
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
            {rightSlot}
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground font-mono text-xs text-background">
              HG
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 hairline-b overflow-y-auto md:block" style={{ borderRight: "1px solid var(--hairline)" }}>
          <nav className="p-3">
            {items.map((it) => {
              const active =
                it.to === pathname ||
                (it.to !== "/portal" && it.to !== "/admin" && pathname.startsWith(it.to));
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  className={`block rounded-sm px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
