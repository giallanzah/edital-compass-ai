# Bloco 3 — Fechamento do loop e backoffice real

O backend do Bloco 2 (candidaturas, IA, tarefas, roles) já está no ar. Este ciclo transforma isso em experiência visível para o usuário final e para o administrador, além de resolver as 3 pendências de UX que ficaram em aberto.

## Objetivos
1. Ninguém usa o portal sem perfil de empresa preenchido.
2. Toda candidatura ativa com prazo curto grita na interface.
3. IA de resumo/requisitos aparece no detalhe do edital com 1 clique e alimenta o checklist da candidatura.
4. Backoffice deixa de ter stub em Empresas, Usuários e Projetos.
5. Links compartilhados de edital têm preview decente (og:image dinâmico).

---

## 1. Onboarding obrigatório
- `beforeLoad` em `src/routes/portal.tsx` (layout autenticado): se usuário logado e `empresas_perfil` não existe, `throw redirect({ to: '/portal/onboarding' })`.
- Exceção: a própria rota `/portal/onboarding` e `/portal/editais*` (públicas) não redirecionam.
- Após concluir onboarding, redirect para `/portal` (dashboard).
- Estado vazio do dashboard (sem projetos ou sem candidaturas) ganha CTA claro em vez de lista vazia.

## 2. Alertas de prazo no portal
- Hook único chamando `alertasPrazo()` (já existe em `candidatura.functions.ts`).
- Badge no header do `PortalShell` quando ≥1 candidatura com edital encerrando em ≤7 dias, clicável → `/portal/candidaturas`.
- Na lista `/portal/candidaturas`, cada card com prazo ≤7d recebe pill vermelha "Encerra em X dias".
- No detalhe da candidatura, banner de alerta no topo quando aplicável.

## 3. IA no detalhe do edital
- Em `/portal/editais/$id`: dois botões — "Resumir com IA" e "Extrair requisitos".
- Chamam `resumirEdital` / `extrairRequisitos` (já existentes). Cache automático via `ia_hash`.
- Resultado renderizado em card dedicado. Se já cacheado, aparece imediatamente ao abrir a página.
- No modal `CandidatarModal`, ao criar candidatura, opção "importar requisitos como checklist" → cria tarefas a partir de `requisitos_ia.itens`.
- No detalhe da candidatura, botão "Analisar aderência" chama `analisarAderencia` (já existente) e mostra parecer + score.

## 4. Backoffice — 3 telas reais
Cada uma substitui o `AdminStubPage` correspondente e usa `admin.functions.ts` já existente, com gate por `has_role(auth.uid(),'ADMIN')`.

- **`/admin/empresas`**: tabela de `empresas_perfil` com busca por nome/CNPJ, colunas (empresa, porte, UF, setor, #projetos, #candidaturas, criado em). Linha clicável abre drawer com detalhes.
- **`/admin/usuarios`**: lista `auth.users` (via `supabaseAdmin` no server fn), mostra email, role atual, data de criação. Ação "promover a ADMIN" / "rebaixar" via `promover_usuario` RPC. Confirmação inline.
- **`/admin/projetos`**: visão consolidada de `projetos` de todos os usuários, com filtro por status de candidatura e coluna com edital vinculado (se houver).

Bootstrap do primeiro admin: seção discreta em `/admin/login` que chama `bootstrap_admin()` quando não existe nenhum ADMIN — some depois do primeiro.

## 5. SEO dinâmico
- `head()` de `/portal/editais/$id` gera `og:image` via rota `/api/og/edital/$id` (SVG→PNG server-side simples: título + fonte + prazo, tipografia do projeto).
- `sitemap.xml.ts`: incluir todos os editais com `status ∈ {aberto, abre_em_breve}`.

---

## Fora deste ciclo
Pagamentos, envio de email, geração de documento de projeto pela IA, kanban drag-and-drop (mudança de estágio segue por dropdown), integrações de submissão externa.

## Ordem de execução
1. Onboarding gate + estados vazios do dashboard.
2. Alertas de prazo (header badge + pills + banner).
3. IA no detalhe do edital + import de checklist no modal + aderência no detalhe da candidatura.
4. Admin: Empresas → Projetos → Usuários (nessa ordem; usuários por último por envolver service role).
5. `og:image` dinâmico e sitemap ampliado.

## Detalhes técnicos
- Gate de onboarding: `beforeLoad` em `portal.tsx` faz `supabase.from('empresas_perfil').select('id').eq('user_id', user.id).maybeSingle()` client-side (layout já é `ssr:false` sob `_authenticated` se aplicável; caso contrário usar server fn `getPerfil`).
- Alertas: `useQuery(['alertas-prazo'])` no `PortalShell`, refetch a cada 5 min.
- OG image: rota `src/routes/api/og.edital.$id.ts` retornando `image/svg+xml` (sem dependência nativa; SVG é aceito por WhatsApp/Twitter como preview quando servido com o header correto — se precisar PNG, usar `@vercel/og` compatível com Worker).
- Admin usuários: server fn com `await import('@/integrations/supabase/client.server')` dentro do handler + checagem `has_role`.
- Nenhuma mudança no robô de coleta nem no design system.
