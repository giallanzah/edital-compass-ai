// Endpoint público para o cron externo (pg_cron ou similar).
// Autenticação por header `apikey` = SUPABASE_ANON_KEY.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/cron/scrape")({
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
        const { runScrape } = await import("@/lib/scrape/robot.server");
        try {
          const body = (await request.json().catch(() => ({}))) as {
            fonte?: "cnpq" | "finep" | "sebrae" | "bndes" | "todas";
          };
          const fonte = body.fonte ?? "todas";
          const result = await runScrape(fonte);
          return Response.json({ ok: true, ...result });
        } catch (e) {
          console.error("[cron/scrape] falhou", e);
          return Response.json(
            { ok: false, error: e instanceof Error ? e.message : String(e) },
            { status: 500 },
          );
        }
      },
    },
  },
});
