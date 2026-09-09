// Solicitações de acesso para perfis que exigem aprovação (consultor / equipe).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PerfilRestrito = "consultor" | "admin";

function parsePerfil(input: { perfil: string; nome?: string }) {
  if (input.perfil !== "consultor" && input.perfil !== "admin") {
    throw new Error("Perfil inválido.");
  }
  return { perfil: input.perfil as PerfilRestrito, nome: input.nome ?? null };
}

// Idempotente: devolve a solicitação pendente existente ou cria uma nova.
export const registrarSolicitacaoAcesso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parsePerfil)
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;

    const { data: existente, error: errBusca } = await supabase
      .from("solicitacoes_acesso")
      .select("id, perfil, status")
      .eq("user_id", userId)
      .eq("perfil", data.perfil)
      .eq("status", "pendente")
      .maybeSingle();
    if (errBusca) throw new Error(errBusca.message);
    if (existente) return { status: "pendente" as const, criada: false };

    const email = typeof claims.email === "string" ? claims.email : "";
    const { error } = await supabase.from("solicitacoes_acesso").insert({
      user_id: userId,
      perfil: data.perfil,
      nome: data.nome,
      email,
      status: "pendente",
    });
    if (error) throw new Error(error.message);
    return { status: "pendente" as const, criada: true };
  });

export const minhaSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(parsePerfil)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("solicitacoes_acesso")
      .select("status, created_at")
      .eq("user_id", context.userId)
      .eq("perfil", data.perfil)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
