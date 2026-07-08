# Status atual — o que já ficou pronto e o que sobrou

## Já entregue nas últimas iterações
- **Robô de coleta**: Firecrawl + `/api/public/cron/scrape` + pg_cron 6/6h; parsers CNPq/FINEP/SEBRAE/BNDES; histórico e logs.
- **Admin real**: `/admin/fontes`, `/admin/coletas`, `/admin/editais` operando sobre banco. Login com verificação de role ADMIN/SUPER_ADMIN e mensagens claras.
- **Portal Bloco 1**: Supabase Auth em `/portal/login`, guard em `/portal/*` (catálogo público), onboarding 5 passos, perfil de empresa, match score real (Tema 40 / Porte 25 / Região 20 / Status 15), dashboard com "recomendados", CRUD de projetos, catálogo e detalhe consumindo banco.

## Pendências identificadas
1. **Candidaturas ainda são casca**: existe tabela `candidaturas` e listagem, mas não há fluxo para criar uma candidatura a partir do edital, mudar estágio, calcular progresso, nem herdar prazo.
2. **Detalhe do edital não conecta com projeto**: falta CTA "candidatar este edital" que abra seletor de projeto e crie a candidatura.
3. **Sem IA aplicada**: o robô traz texto bruto; não há resumo executivo, checklist de requisitos, nem análise de aderência (o match hoje é só heurístico por tags).
4. **Backoffice ainda tem 13 stubs** (`admin.empresas`, `admin.projetos`, `admin.usuarios` etc.) — os 3 primeiros são os que travam operação real.
5. **Onboarding não é obrigatório**: usuário sem perfil consegue ver o dashboard vazio em vez de ser levado ao onboarding.
6. **Sem notificação de prazo**: candidaturas com edital encerrando em ≤7 dias não sinalizam nada.

---

# Próximo passo evolutivo — Bloco 2

Foco: fechar o loop **descobrir → candidatar → acompanhar** e introduzir IA onde ela muda o produto.

## 1. Fluxo de candidatura ponta-a-ponta
- No `/portal/editais/$id`: botão **"Candidatar-se com um projeto"** abre modal listando projetos do usuário (ou permite criar um novo inline). Ao confirmar, cria linha em `candidaturas` com `estagio='rascunho'`, `progresso=0`, herda `data_encerramento` do edital.
- `/portal/candidaturas` vira kanban simples com 6 colunas (`rascunho`, `aplicando`, `em_revisao`, `submetido`, `aprovado`, `reprovado`). Drag-and-drop atualiza estágio; progresso calculado por estágio (0/25/50/75/100/100).
- Detalhe da candidatura em `/portal/candidaturas/$id`: mostra edital, projeto, checklist de tarefas, dias restantes, botão para trocar estágio, campo de observações.
- Badge no topo do portal quando ≥1 candidatura tem edital encerrando em ≤7 dias.

## 2. IA aplicada (Lovable AI Gateway, sem chave do usuário)
Três server functions novas, chamadas sob demanda e resultado cacheado em coluna JSON dos `editais`:
- `resumirEdital(id)` → `resumo_ia`: 3 bullets — objetivo, quem pode, valor/prazo.
- `extrairRequisitos(id)` → `requisitos_ia[]`: checklist normalizada ("Empresa com CNPJ ativo", "Faturamento até X", "Projeto em TRL 4-7"…). Vira o checklist inicial da candidatura.
- `analisarAderencia(editalId, projetoId)` → parecer textual + score refinado que sobrepõe o match heurístico quando existir perfil + descrição de projeto.

Cache: só recomputa se `hash_conteudo` do edital mudou. Custo controlado (só editais visualizados/candidatados).

## 3. Onboarding obrigatório + estados vazios
- Após login, se `empresas_perfil` não existe → redirect forçado para `/portal/onboarding`.
- Dashboard e "recomendados" mostram CTA claro quando perfil vazio, em vez de lista vazia.

## 4. Backoffice — 3 telas que passam de stub para real
- `/admin/empresas`: lista `empresas_perfil` com busca por CNPJ/nome, ver detalhe, contagem de projetos/candidaturas por empresa.
- `/admin/usuarios`: lista de `auth.users` via service role, com role atual (`user_roles`) e ação de promover/rebaixar ADMIN.
- `/admin/projetos`: visão consolidada dos projetos de todos os usuários, com filtro por status de candidatura.

## 5. SEO e polimento
- `og:image` dinâmico no detalhe do edital (usa título + fonte).
- Sitemap inclui todos os editais ativos (já existe `sitemap.xml.ts`; validar).

## Fora deste bloco
Pagamentos/Stripe, envio real de emails, geração automatizada do documento de projeto pela IA, integrações com plataformas externas de submissão (CNPq/FINEP não têm API pública de envio).

---

# Detalhes técnicos

- **Migração**: adicionar colunas `resumo_ia jsonb`, `requisitos_ia jsonb`, `resumo_ia_hash text` em `editais`; tabela `candidatura_tarefas (id, candidatura_id, titulo, feito bool, ordem int)` com RLS por dono.
- **IA**: `createServerFn` chamando Lovable AI Gateway (`google/gemini-2.5-flash` para resumo/extração, `google/gemini-2.5-pro` para aderência). Middleware `requireSupabaseAuth`. Resposta forçada em JSON via schema Zod.
- **Kanban**: `@dnd-kit/core` (leve, já suportado). Otimista com `useMutation` + `queryClient.setQueryData`.
- **Admin usuários**: server fn com `supabaseAdmin` (import dinâmico dentro do handler), gate por `has_role(auth.uid(),'ADMIN')`.
- **Onboarding gate**: verificação server-side em `beforeLoad` de `/portal/_authenticated`, redirect via `throw redirect({ to: '/portal/onboarding' })`.

## Ordem de execução
1. Migração (colunas IA + `candidatura_tarefas`) e gate de onboarding.
2. Fluxo de candidatura (modal no detalhe, criação, kanban, detalhe da candidatura).
3. IA de resumo e extração de requisitos + integração com o checklist.
4. IA de aderência sobrepondo o match no dashboard.
5. Três telas admin reais (empresas, usuários, projetos).
6. Polimento SEO e badge de prazo.

Posso seguir com esse Bloco 2?
