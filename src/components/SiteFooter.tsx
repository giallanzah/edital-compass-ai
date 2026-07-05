import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="hairline-t">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A camada de inteligência sobre o ecossistema brasileiro de fomento à inovação.
          </p>
        </div>
        <div>
          <div className="eyebrow mb-4">Produto</div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/portal" className="text-muted-foreground hover:text-foreground">
                Portal
              </Link>
            </li>
            <li>
              <Link to="/portal/editais" className="text-muted-foreground hover:text-foreground">
                Catálogo de editais
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-muted-foreground hover:text-foreground">
                Backoffice
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Fontes monitoradas</div>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li>CNPq</li>
            <li>FINEP</li>
            <li>SEBRAE</li>
            <li>BNDES</li>
          </ul>
        </div>
        <div>
          <div className="eyebrow mb-4">Conta</div>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/portal/login" className="text-muted-foreground hover:text-foreground">
                Entrar / Cadastrar
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="hairline-t">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span>© 2026 fomenta.ai — Brasil</span>
        </div>
      </div>
    </footer>
  );
}
