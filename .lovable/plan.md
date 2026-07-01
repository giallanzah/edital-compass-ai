# Fomenta AI — Backend de editais + Robô de coleta

Vou transformar o wireframe atual em um portal com dados reais, alimentado por um robô que coleta editais das fontes públicas (CNPq, FINEP, SEBRAE, BNDES) periodicamente.

## Escopo desta entrega

### 1. Lovable Cloud (banco + jobs)
Ativar Cloud para ter Postgres, autenticação e execução server-side. Os dados de editais passam a vir do banco (não mais do mock `src/data/editais.ts`).

### 2. Modelo de dados
Migrations com as tabelas:
- `fontes_monitoradas` — CNPq, FINEP, SEBRAE, BNDES (seed inicial), com `url_base`, `ativo`, `frequencia_horas`, `ultimo_sucesso_em`, `status_coleta`.
- `editais` — todos os campos do prompt (título, slug, fonte, url_original, url_canonica, descrição, datas, status, público, abrangência, tipo_apoio, valor, tags_json, documentos_json, hash_conteudo, confianca_extracao, ativo).
- `editais_historico` — versão anterior salva quando o `hash_conteudo` muda.
- `logs_coleta` — execução por fonte (início, fim, total lido/novo/atualizado, mensagem_erro).
- RLS: leitura pública em `editais` e `fontes_monitoradas`; escrita apenas por role admin. Roles ficam em tabela `user_roles` separada com função `has_role()`.

### 3. Robô de coleta (Firecrawl + server functions)
- Usar **Firecrawl** como conector (scraping robusto, lida com JS, respeita rate limits — melhor que rodar Puppeteer em Worker).
- Um **server route público** `/api/public/cron/scrape` protegido por `CRON_SECRET`, chamável por scheduler externo a cada 6 h.
- Um parser por fonte em `src/lib/scrapers/<fonte>.ts`:
  - `cnpq.ts` — `gov.br/cnpq/pt-br/chamadas/abertas-para-submissao`
  - `finep.ts` — chamadas públicas FINEP
  - `sebrae.ts` — `observatorio.sebraestartups.com.br/oportunidades`
  - `bndes.ts` — chamadas de inovação BNDES
- Pipeline por edital: normalizar → calcular `hash_conteudo` → upsert por (`fonte`, `url_canonica`) → se hash mudou, salvar histórico + atualizar → deduplicar por título normalizado + órgão + período → classificar status (`aberto` / `abre em breve` / `encerrando em breve` / `encerrado` / `sem prazo`) → calcular `confianca_extracao` (1.0 / 0.7 / 0.4 / <0.4 revisão).
- Classificação heurística por palavras-chave (subvenção, incubadora, startups, ICT, PD&I) → `tipo_apoio`, `publico_alvo`, `tema`.
- Execução manual: botão no admin dispara server fn `runScrape({ fonte })`.

### 4. Frontend do portal (dados reais)
- `/portal/editais` — hoje lê mock; passa a consumir server fn `listEditais({ busca, fonte, status, area, uf, tipoApoio })` com filtros server-side.
- Chips CNPq/FINEP/SEBRAE/BNDES com **contagem dinâmica** vinda do banco (fallback para os números do wireframe se banco vazio).
- Seções "novos editais" e "encerrando em breve" na home do portal.
- `/portal/editais/$id` — detalhe completo do edital + timeline de versões.

### 5. Backoffice
Adicionar em `/admin`:
- `/admin/fontes` — CRUD de fontes monitoradas, toggle ativo, botão "coletar agora" por fonte, último status.
- `/admin/coletas` — logs de execução com totais e erros.
- `/admin/editais` (já existe stub) — passa a listar dados reais, com ação "revisar" para editais com `confianca_extracao < 0.4`, e toggle `ativo`/oculto.

### 6. Fora de escopo desta entrega
- Autenticação de empresa/portal (o wireframe segue mock por enquanto).
- Agendamento cron automático hospedado: entrego o endpoint pronto + instruções para plugar em pg_cron/cron-job.org. Rodar cron dentro do Worker não é confiável.
- Playwright/Puppeteer próprio: Firecrawl já cobre JS-rendering; se uma fonte específica falhar, tratamos depois.

## Detalhes técnicos

- **Stack**: mantém TanStack Start + Cloud (Supabase). Sem edge functions do Supabase — toda lógica em `createServerFn` e server routes, como manda a stack.
- **Conector Firecrawl**: linkar via `standard_connectors--connect`. Chave fica em `FIRECRAWL_API_KEY` no runtime server.
- **Secret**: `CRON_SECRET` para autenticar o endpoint público.
- **Roles admin**: `app_role` enum + `user_roles` + `has_role()` (padrão seguro, não em `profiles`).

## Ordem de execução
1. Enable Cloud + migrations (tabelas, RLS, grants, roles, seed das 4 fontes).
2. Firecrawl + secret CRON_SECRET.
3. Scrapers por fonte + pipeline de normalização/dedupe/histórico.
4. Server route `/api/public/cron/scrape` + server fn `runScrape`.
5. Server fns de leitura (`listEditais`, `getEdital`, `listFontes`, `listLogs`).
6. Trocar mocks no portal por dados reais + contagens dinâmicas.
7. Telas admin de fontes e coletas + ações de revisão.

Confirma que posso ativar o Cloud e conectar o Firecrawl (necessários para o robô funcionar de verdade)?
