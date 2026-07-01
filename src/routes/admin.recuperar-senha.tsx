import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/admin/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha · Backoffice" }] }),
  component: Recuperar,
});

function Recuperar() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10">
          <Logo />
        </div>
        <div className="eyebrow mb-2">Backoffice</div>
        <h1 className="text-2xl font-medium tracking-tight">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviaremos um link de redefinição para o e-mail administrativo cadastrado.
        </p>

        {sent ? (
          <div className="mt-8 rounded-sm hairline p-4 text-sm">
            Se <span className="font-mono">{email}</span> estiver cadastrado, você receberá as
            instruções em instantes.
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="mt-8 space-y-5"
          >
            <div>
              <label className="eyebrow mb-1.5 block">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-sm border border-[var(--hairline)] bg-background px-3 text-sm outline-none focus:border-foreground"
                placeholder="voce@fomenta.ai"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
            >
              Enviar link de recuperação
            </button>
          </form>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/admin/login"
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            ← voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}
