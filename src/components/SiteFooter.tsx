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
        {[
          { title: "Produto", links: ["Portal", "Backoffice", "API", "Changelog"] },
          { title: "Editais", links: ["CNPq", "FINEP", "SEBRAE", "Lei do Bem"] },
          { title: "Empresa", links: ["Sobre", "Parcerias", "Imprensa", "Contato"] },
        ].map((col) => (
          <div key={col.title}>
            <div className="eyebrow mb-4">{col.title}</div>
            <ul className="space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="hairline-t">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-6 py-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <span>© 2026 fomenta.ai — Brasil</span>
          <span className="font-mono">v0.1.0 · wireframe</span>
        </div>
      </div>
    </footer>
  );
}
