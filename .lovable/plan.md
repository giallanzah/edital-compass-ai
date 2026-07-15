
# Bloco 4 — Distribuição, notificação e produção de conteúdo

Bloco 3 fechou o loop de UX (onboarding, alertas, IA no detalhe, backoffice real). Falta o que faz o portal **crescer** (SEO dos editais públicos), **reter** (notificações que trazem o usuário de volta) e **produzir valor tangível** (documento de projeto gerado por IA a partir do edital + perfil da empresa).

## Objetivos
1. Editais públicos viram links compartilháveis com preview visual — pendência declarada do Bloco 3.
2. Usuário recebe alerta por email quando um edital com fit alto abre ou quando prazo de candidatura ativa se aproxima.
3. Um clique no detalhe da candidatura gera um rascunho de proposta técnica em markdown, editável, salvo no banco.
4. Kanban de candidaturas deixa de ser dropdown-only e ganha visão por estágio.

---

## 1. SEO dinâmico dos editais (pendência do Bloco 3)
- Nova rota `src/routes/api/og.edital.$id.ts`: retorna SVG (image/svg+xml) com título, órgão, prazo e branding minimalista do projeto. Sem dep nativa; SVG é aceito por WhatsApp/LinkedIn/Twitter como og:image.
- `head()` de `/portal/editais/$id` adiciona `og:image` e `twitter:image` apontando para `${origin}/api/og/edital/${id}` (URL absoluta, derivada do loader).
- `sitemap.xml.ts` amplia a listagem: inclui todos os editais com `status ∈ {aberto, abre_em_breve}` (hoje só lista home + rotas fixas).
- Meta `description` do detalhe passa a usar `resumo_ia` quando disponível, com fallback para os primeiros 155 chars do texto do edital.

## 2. Notificações por email (opt-in)
Modelo: **preferência do usuário + job diário**, sem broker externo — usa Resend via connector.
- Nova tabela `notif_preferencias` (user_id, alertas_prazo bool, alertas_novos_editais bool, min_score int). RLS por user_id. GRANT completo.
- Nova tabela `notif_enviadas` (user_id, tipo, ref_id, enviado_em) para deduplicar.
- Server route `src/routes/api/public/cron/notificar.ts` (pg_cron diário) que, para cada usuário com preferências ativas:
  - **Prazo**: se alguma candidatura ativa tem edital encerrando em ≤3d e ainda não notificado hoje, envia email.
  - **Novos editais**: cruza editais abertos nas últimas 24h com `empresas_perfil` do usuário via `computeScore` (`src/lib/match.ts`); se ≥1 acima do `min_score`, envia digest.
- Seção "Notificações" em `/portal/perfil` para editar preferências.
- Templates de email em HTML mínimo (paleta do projeto), enviados por Resend (secret `RESEND_API_KEY` — solicitar via add_secret na hora).

## 3. Geração de proposta técnica por IA
Em `/portal/candidaturas/$id`, novo card "Rascunho de proposta":
- Botão "Gerar rascunho com IA" chama nova server fn `gerarProposta` (em `src/lib/ai.functions.ts`).
- Prompt combina: `editais.texto` + `editais.requisitos_ia` + `empresas_perfil` + `projetos.descricao` da candidatura.
- Modelo `openai/gpt-5.5`, saída markdown com seções fixas (Sumário Executivo, Aderência ao Edital, Metodologia, Cronograma, Equipe, Orçamento indicativo).
- Persistência: nova coluna `candidaturas.proposta_md` (text) + `proposta_gerada_em` (timestamptz).
- UI: editor textarea simples com preview markdown ao lado, botão "Salvar" e "Regenerar" (regenerar exige confirmação).

## 4. Kanban de candidaturas
- `/portal/candidaturas` ganha toggle "Lista / Kanban".
- Kanban: 6 colunas fixas (rascunho, aplicando, em_revisao, submetido, aprovado, reprovado), cards enxutos (título do edital, prazo, pill se ≤7d).
- Mudança de estágio via drag-and-drop usa `@dnd-kit/core` (leve, sem dep nativa). Chama `atualizarEstagioCandidatura` já existente.
- Persistência de preferência de visualização em `localStorage` (não em banco).

---

## Fora deste ciclo
Pagamentos/Stripe, submissão externa automatizada aos portais dos editais, geração de PDF (fica em markdown), notificações push/webhook, mudanças no robô de coleta, redesign visual.

## Ordem de execução
1. SEO: rota og.edital + head() + sitemap ampliado. (Rápido, entrega imediata.)
2. Kanban (front-end puro, sem migração).
3. Geração de proposta: migração `proposta_md` + server fn + UI.
4. Notificações: migrações + preferências no perfil + cron + templates. (Último por depender de secret Resend e ter mais superfície.)

## Detalhes técnicos

**og:image via SVG**
```text
src/routes/api/og.edital.$id.ts
  loader lê edital pelo id (server publishable client, política TO anon já existe)
  retorna new Response(svg, { headers: { 'content-type': 'image/svg+xml', 'cache-control': 'public, max-age=3600' } })
```

**Notificações — arquitetura**
```text
pg_cron (Supabase) → GET https://project--{id}.lovable.app/api/public/cron/notificar
  header x-cron-secret (valida com timingSafeEqual)
  supabaseAdmin (dentro do handler, via await import)
  para cada usuário: monta payload → Resend REST → grava notif_enviadas
```
Se `RESEND_API_KEY` não existir no momento da execução, pedir via `secrets--add_secret` antes de escrever o handler.

**Kanban**
```text
bun add @dnd-kit/core @dnd-kit/sortable
DndContext com 6 <Column>; onDragEnd → atualizarEstagioCandidatura({ id, estagio })
optimistic update via queryClient.setQueryData
```

**Proposta IA**
```text
gerarProposta.handler:
  const gateway = createLovableAiGatewayProvider(process.env.LOVABLE_API_KEY!)
  generateText({ model: gateway('openai/gpt-5.5'), prompt: buildPrompt(...) })
  update candidaturas set proposta_md=..., proposta_gerada_em=now() where id=... and user_id=auth
```

Nenhuma mudança em: design system, robô de coleta, autenticação, RLS existente das tabelas atuais.
