import { Link } from "@tanstack/react-router";

// Erro comum: sessão Supabase ausente ou role insuficiente.
export function AdminErrorState({ error }: { error: Error }) {
  const msg = error.message ?? "";
  const authProblem =
    msg.toLowerCase().includes("unauthorized") ||
    msg.toLowerCase().includes("forbidden") ||
    msg.toLowerCase().includes("no authorization");

  return (
    <div className="mx-auto max-w-xl px-8 py-16 text-center">
      <div className="eyebrow mb-2">Erro</div>
      <h1 className="text-2xl font-medium tracking-tight">
        {authProblem ? "Sem permissão de administrador" : "Não foi possível carregar"}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {authProblem ? (
          <>
            As telas reais do backoffice usam sua sessão Supabase com role{" "}
            <span className="font-mono">ADMIN</span> ou <span className="font-mono">SUPER_ADMIN</span>.
            Faça login pelo portal com uma conta admin e recarregue esta página.
          </>
        ) : (
          <span className="font-mono">{msg}</span>
        )}
      </p>
      <div className="mt-8 flex justify-center gap-2">
        <Link
          to="/portal/login"
          className="inline-flex h-9 items-center rounded-sm bg-foreground px-4 text-sm font-medium text-background"
        >
          Ir para login do portal
        </Link>
        <Link
          to="/admin"
          className="inline-flex h-9 items-center rounded-sm hairline px-4 text-sm hover:bg-secondary"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
