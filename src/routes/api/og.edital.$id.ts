// og:image dinâmico para editais — SVG puro (sem dep nativa).
// URL pública, cacheável, aceita por WhatsApp/LinkedIn/Twitter como preview.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/og/edital/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const col = UUID_RE.test(params.id) ? "id" : "slug";
        const { data: e } = await supabaseAdmin
          .from("editais")
          .select("titulo, fonte, data_encerramento, tipo_apoio")
          .eq(col, params.id)
          .maybeSingle();

        const title = clip(e?.titulo ?? "Edital não encontrado", 110);
        const fonte = e?.fonte ?? "";
        const tipo = e?.tipo_apoio ?? "";
        const prazo = e?.data_encerramento
          ? `Encerra ${new Date(e.data_encerramento).toLocaleDateString("pt-BR")}`
          : "Sem prazo definido";

        const svg = renderSvg({ title, fonte, tipo, prazo });
        return new Response(svg, {
          headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});

function clip(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + "…";
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = (cur ? cur + " " : "") + w;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[lines.length - 1] = clip(lines[lines.length - 1], maxChars);
  }
  return lines;
}

function renderSvg({
  title,
  fonte,
  tipo,
  prazo,
}: {
  title: string;
  fonte: string;
  tipo: string;
  prazo: string;
}) {
  const W = 1200;
  const H = 630;
  const titleLines = wrap(title, 34, 4);
  const startY = 260 - (titleLines.length - 1) * 34;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="8" fill="#0a0a0a"/>
  <g font-family="ui-sans-serif, -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif">
    <text x="80" y="110" font-size="22" letter-spacing="4" fill="#666" font-weight="500">FOMENTA.AI · EDITAL</text>
    ${titleLines
      .map(
        (ln, i) =>
          `<text x="80" y="${startY + i * 72}" font-size="60" font-weight="500" fill="#0a0a0a" letter-spacing="-1.5">${esc(ln)}</text>`,
      )
      .join("\n    ")}
    <g transform="translate(80, 500)">
      ${fonte ? `<rect x="0" y="0" width="${fonte.length * 12 + 32}" height="36" fill="none" stroke="#0a0a0a" stroke-width="1"/><text x="16" y="24" font-size="16" fill="#0a0a0a" font-family="ui-monospace, 'SF Mono', Menlo, monospace">${esc(fonte)}</text>` : ""}
      ${tipo ? `<rect x="${fonte ? fonte.length * 12 + 44 : 0}" y="0" width="${tipo.length * 10 + 32}" height="36" fill="none" stroke="#0a0a0a" stroke-width="1"/><text x="${fonte ? fonte.length * 12 + 60 : 16}" y="24" font-size="16" fill="#0a0a0a" font-family="ui-monospace, 'SF Mono', Menlo, monospace">${esc(tipo)}</text>` : ""}
    </g>
    <text x="80" y="580" font-size="20" fill="#666" font-family="ui-monospace, 'SF Mono', Menlo, monospace">${esc(prazo)}</text>
    <text x="${W - 80}" y="580" font-size="20" fill="#666" text-anchor="end" font-family="ui-monospace, 'SF Mono', Menlo, monospace">fomenta.ai</text>
  </g>
</svg>`;
}
