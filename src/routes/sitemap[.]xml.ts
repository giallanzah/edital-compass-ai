// Sitemap dinâmico: landing, catálogo e todos os editais ativos.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sitemap[.]xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const origin = new URL(request.url).origin;

        const { data: rows } = await supabaseAdmin
          .from("editais")
          .select("slug, updated_at")
          .eq("ativo", true)
          .eq("oculto", false)
          .order("updated_at", { ascending: false })
          .limit(5000);

        const urls: { loc: string; lastmod?: string; priority: string }[] = [
          { loc: `${origin}/`, priority: "1.0" },
          { loc: `${origin}/portal/editais`, priority: "0.9" },
          ...(rows ?? []).map((r) => ({
            loc: `${origin}/portal/editais/${r.slug}`,
            lastmod: r.updated_at ? String(r.updated_at).slice(0, 10) : undefined,
            priority: "0.7",
          })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
