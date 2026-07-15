// Cron diário de notificações por e-mail.
// Chamado por pg_cron via net.http_post com header `apikey` = SUPABASE_ANON_KEY.
// Envia via Resend REST (RESEND_API_KEY). Sem a chave, apenas loga o que enviaria.
import { createFileRoute } from "@tanstack/react-router";
import { computeMatchLocal, type EditalParaMatch, type PerfilParaMatch } from "@/lib/match";

export const Route = createFileRoute("/api/public/cron/notificar")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("apikey");
        const expected =
          process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
        if (!expected || apiKey !== expected) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const resendKey = process.env.RESEND_API_KEY;
        const fromAddr = process.env.RESEND_FROM ?? "fomenta.ai <onboarding@resend.dev>";
        const baseUrl =
          process.env.PUBLIC_APP_URL ?? "https://edital-compass-ai.lovable.app";

        const summary = { prazo: 0, novos: 0, erros: 0, skipped_no_key: !resendKey };

        // 1) Preferências ativas
        const { data: prefs } = await supabaseAdmin
          .from("notif_preferencias")
          .select("user_id, email, alertas_prazo, alertas_novos_editais, min_score");
        if (!prefs || prefs.length === 0) return Response.json({ ok: true, ...summary });

        // 2) Editais abertos nas últimas 24h (uma consulta, reutilizada)
        const desde = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { data: novosEditais } = await supabaseAdmin
          .from("editais")
          .select(
            "id, slug, titulo, fonte, status, tema, publico_alvo, abrangencia, uf, tipo_apoio, data_encerramento",
          )
          .eq("ativo", true)
          .eq("oculto", false)
          .eq("status", "aberto")
          .gte("created_at", desde);

        for (const p of prefs) {
          try {
            // ---- Alertas de prazo ----
            if (p.alertas_prazo) {
              const limite = new Date(Date.now() + 3 * 86400_000).toISOString();
              const { data: cands } = await supabaseAdmin
                .from("candidaturas")
                .select(
                  "id, edital:editais(id, titulo, slug, data_encerramento)",
                )
                .eq("user_id", p.user_id)
                .in("estagio", ["rascunho", "aplicando", "em_revisao"]);
              const urgentes = (cands ?? []).filter((c) => {
                const dt = (c.edital as { data_encerramento: string | null } | null)
                  ?.data_encerramento;
                if (!dt) return false;
                return dt > new Date().toISOString() && dt < limite;
              });
              for (const c of urgentes) {
                const refId = `${c.id}:${new Date().toISOString().slice(0, 10)}`;
                const { data: existente } = await supabaseAdmin
                  .from("notif_enviadas")
                  .select("id")
                  .eq("user_id", p.user_id)
                  .eq("tipo", "prazo")
                  .eq("ref_id", refId)
                  .maybeSingle();
                if (existente) continue;
                const ed = c.edital as {
                  titulo: string;
                  slug: string;
                  data_encerramento: string;
                };
                const html = renderPrazoEmail({
                  titulo: ed.titulo,
                  encerramento: ed.data_encerramento,
                  link: `${baseUrl}/portal/candidaturas/${c.id}`,
                });
                const ok = await enviarEmail({
                  resendKey,
                  from: fromAddr,
                  to: p.email,
                  subject: `Prazo curto — ${ed.titulo}`,
                  html,
                });
                if (ok) {
                  await supabaseAdmin.from("notif_enviadas").insert({
                    user_id: p.user_id,
                    tipo: "prazo",
                    ref_id: refId,
                  });
                  summary.prazo++;
                }
              }
            }

            // ---- Alertas de novos editais compatíveis ----
            if (p.alertas_novos_editais && novosEditais && novosEditais.length > 0) {
              const { data: perfil } = await supabaseAdmin
                .from("empresas_perfil")
                .select("temas, porte, uf, estagio")
                .eq("user_id", p.user_id)
                .maybeSingle();
              if (!perfil) continue;

              const scored = novosEditais
                .map((e) => ({
                  e,
                  s: computeMatchLocal(e as EditalParaMatch, perfil as PerfilParaMatch).score,
                }))
                .filter((x) => x.s >= (p.min_score ?? 70))
                .sort((a, b) => b.s - a.s)
                .slice(0, 10);

              if (scored.length === 0) continue;

              const refId = `digest:${new Date().toISOString().slice(0, 10)}`;
              const { data: existente } = await supabaseAdmin
                .from("notif_enviadas")
                .select("id")
                .eq("user_id", p.user_id)
                .eq("tipo", "novos_editais")
                .eq("ref_id", refId)
                .maybeSingle();
              if (existente) continue;

              const html = renderDigestEmail({
                items: scored.map((x) => ({
                  titulo: (x.e as { titulo: string }).titulo,
                  fonte: (x.e as { fonte: string }).fonte,
                  slug: (x.e as { slug: string }).slug,
                  score: x.s,
                })),
                base: baseUrl,
              });
              const ok = await enviarEmail({
                resendKey,
                from: fromAddr,
                to: p.email,
                subject: `${scored.length} novo(s) edital(is) compatível(is) hoje`,
                html,
              });
              if (ok) {
                await supabaseAdmin.from("notif_enviadas").insert({
                  user_id: p.user_id,
                  tipo: "novos_editais",
                  ref_id: refId,
                });
                summary.novos++;
              }
            }
          } catch (e) {
            summary.erros++;
            console.error("[cron/notificar] usuário", p.user_id, e);
          }
        }

        return Response.json({ ok: true, ...summary });
      },
    },
  },
});

async function enviarEmail(args: {
  resendKey?: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  if (!args.resendKey) {
    console.log("[notificar] sem RESEND_API_KEY — seria enviado:", args.subject, "→", args.to);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${args.resendKey}`,
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });
  if (!res.ok) {
    console.error("[notificar] resend falhou", res.status, await res.text().catch(() => ""));
    return false;
  }
  return true;
}

function shell(inner: string) {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#fff;color:#0a0a0a;margin:0;padding:32px 16px;">
<div style="max-width:520px;margin:0 auto;">
<div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#666;margin-bottom:24px;">FOMENTA.AI</div>
${inner}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0 12px;">
<div style="font-size:11px;color:#888;">Você recebeu este email porque ativou notificações em fomenta.ai.</div>
</div></body></html>`;
}

function renderPrazoEmail(a: { titulo: string; encerramento: string; link: string }) {
  const dias = Math.max(
    0,
    Math.ceil((new Date(a.encerramento).getTime() - Date.now()) / 86_400_000),
  );
  return shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px;letter-spacing:-0.5px;">Prazo curto — ${escape(a.titulo)}</h1>
    <p style="font-size:14px;line-height:1.6;color:#333;">
      Sua candidatura ainda está ativa e o edital encerra em <strong>${dias} dia${dias === 1 ? "" : "s"}</strong> (${new Date(a.encerramento).toLocaleDateString("pt-BR")}).
    </p>
    <a href="${a.link}" style="display:inline-block;margin-top:16px;background:#0a0a0a;color:#fff;padding:10px 18px;text-decoration:none;font-size:13px;font-weight:500;">
      Abrir candidatura →
    </a>
  `);
}

function renderDigestEmail(a: {
  items: { titulo: string; fonte: string; slug: string; score: number }[];
  base: string;
}) {
  const rows = a.items
    .map(
      (i) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee;">
        <a href="${a.base}/portal/editais/${i.slug}" style="color:#0a0a0a;text-decoration:none;">
          <div style="font-size:14px;font-weight:500;">${escape(i.titulo)}</div>
          <div style="font-size:11px;color:#888;font-family:ui-monospace,SF Mono,Menlo,monospace;">${escape(i.fonte)} · match ${i.score}</div>
        </a>
      </td>
    </tr>`,
    )
    .join("");
  return shell(`
    <h1 style="font-size:22px;font-weight:500;margin:0 0 12px;letter-spacing:-0.5px;">${a.items.length} novo(s) edital(is) compatível(is)</h1>
    <p style="font-size:14px;line-height:1.6;color:#333;">
      Encontramos editais publicados nas últimas 24h com match acima do seu limiar.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:12px;">${rows}</table>
    <a href="${a.base}/portal/editais" style="display:inline-block;margin-top:16px;background:#0a0a0a;color:#fff;padding:10px 18px;text-decoration:none;font-size:13px;font-weight:500;">
      Abrir catálogo →
    </a>
  `);
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
