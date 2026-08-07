import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";

const NAV = [
  { label: "Portal", to: "/portal" as const },
  { label: "Editais", to: "/portal/editais" as const },
];

const ANCHORS = [
  { label: "Plataforma", hash: "features" },
  { label: "Planos", hash: "pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur hairline-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center" aria-label="Início">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {NAV.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {i.label}
            </Link>
          ))}
          {ANCHORS.map((a) => (
            <Link
              key={a.hash}
              to="/"
              hash={a.hash}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {a.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/entrar"
            className="hidden h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 sm:inline-flex"
          >
            Acessar plataforma
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-border text-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="hairline-t bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col px-6 py-2">
            {NAV.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {i.label}
              </Link>
            ))}
            {ANCHORS.map((a) => (
              <Link
                key={a.hash}
                to="/"
                hash={a.hash}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-muted-foreground hover:text-foreground"
              >
                {a.label}
              </Link>
            ))}
            <Link
              to="/entrar"
              onClick={() => setOpen(false)}
              className="my-3 inline-flex h-10 items-center justify-center rounded-sm bg-foreground text-sm font-medium text-background"
            >
              Acessar plataforma
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
