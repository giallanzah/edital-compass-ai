import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur hairline-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <Link
            to="/portal"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Portal
          </Link>
          <a
            href="#features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Plataforma
          </a>
          <a
            href="#pricing"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Planos
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/portal"
            className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-block"
          >
            Entrar
          </Link>
          <Link
            to="/portal"
            className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
          >
            Acessar plataforma
          </Link>
        </div>
      </div>
    </header>
  );
}
