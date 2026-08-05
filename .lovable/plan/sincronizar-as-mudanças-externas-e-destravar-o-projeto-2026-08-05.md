# Sincronizar as mudanças externas e destravar o projeto

Objetivo: trazer para cá tudo o que foi alterado fora deste ambiente e deixar o projeto compilando de novo.

## Diagnóstico — o que eu verifiquei agora

O projeto **está travado**, e a causa é exatamente uma sincronização incompleta:

- No Git, o branch de trabalho e a `main` estão idênticos (`0` à frente, `0` atrás, nada pendente). O código externo **já chegou**.
- Mas o banco de dados **não acompanhou**. Existem dois arquivos de migração no repositório que nunca foram executados:
  - `20260723140000_admin_audit_log.sql`
  - `20260726120000_consultores.sql`
- Confirmei consultando o banco: as tabelas `admin_audit_log`, `consultores`, `consultor_clientes` e `atividades_consultor` **não existem**, nem a função `credenciar_consultor`. O banco tem apenas 11 tabelas, todas anteriores a esses arquivos.
- Resultado: o módulo de Consultor e o log de auditoria referenciam tabelas inexistentes, os tipos gerados do banco não têm essas tabelas, e o build quebra com ~40 erros em `src/lib/admin.functions.ts` e `src/lib/consultor.functions.ts`.

É o padrão clássico de mudança vinda de fora: **o código veio junto, o schema do banco não**. Migrações em arquivo não são aplicadas sozinhas.

## Passo 1 — Aplicar as migrações pendentes (destrava o build)

Duas migrações, nesta ordem:

**1A. Auditoria administrativa**
- Tabela `admin_audit_log`: quem executou, e-mail, ação, detalhe, data.
- Sem acesso direto de usuários; só o servidor do backoffice grava e lê, após conferir se quem chamou é administrador.

**1B. Módulo Consultor (CRM interno)**
- Novo papel `CONSULTOR` na lista de papéis.
- `consultores`: nome, e-mail, telefone, especialidade, ativo — vinculado a um usuário existente.
- `consultor_clientes`: contrato consultor ↔ empresa, com início, fim, status, créditos contratados e utilizados, observações. Só um contrato ativo por par.
- `atividades_consultor`: tipo, descrição, status, data de vencimento — chamados do cliente e tarefas do consultor.
- Coluna `consultor_id` em `candidaturas`, indicando quem acompanha cada candidatura.
- Função `credenciar_consultor`: só administrador pode credenciar, e sempre sobre um usuário que já existe — nunca cria conta nova.

**Regras de acesso que entram junto:**
- Consultor vê apenas o próprio cadastro, os próprios contratos e as próprias atividades.
- Consultor vê e move as candidaturas, vê as empresas e os projetos apenas dos clientes com contrato ativo na sua carteira.
- Empresa vê o nome e contato do consultor responsável por ela.
- Empresa pode abrir um chamado para o próprio caso, sem enxergar a fila interna.
- Toda escrita administrativa continua passando pelo servidor, que confere o papel antes.

Detalhe técnico: a criação do papel `CONSULTOR` precisa ir numa transação separada do restante, porque Postgres não permite usar um valor de enum recém-criado no mesmo bloco. Serão então três execuções: auditoria, papel, resto do módulo.

## Passo 2 — Regenerar os tipos e validar

- Os tipos do banco (`src/integrations/supabase/types.ts`) são regerados a partir do schema real, passando a incluir as quatro tabelas novas e a função.
- Rodo o typecheck completo e confirmo zero erros antes de encerrar.
- Confiro que `/admin/consultores`, `/admin/contratos` e as telas do consultor carregam sem erro de tabela inexistente.

## Passo 3 — Evitar que se repita

Para que a próxima mudança externa não quebre o projeto de novo:

- Sempre que chegar código de fora que inclua arquivos em `supabase/migrations/`, eu verifico o banco e aplico o que estiver faltando antes de qualquer outra coisa.
- Arquivos gerados (`src/integrations/supabase/types.ts`, `src/routeTree.gen.ts`) não devem ser editados fora daqui — eu sempre os regenero a partir da fonte real.
- Se você quiser um canal formal de duas vias com o GitHub (repositório `edital-compass-ai`), isso é feito por você no menu **+ → GitHub → Connect project**; depois disso o código passa a sincronizar automaticamente nos dois sentidos, e eu continuo responsável por aplicar as migrações que vierem junto.

## Entregável

Banco alinhado ao código que veio de fora, build limpo, e o módulo de Consultor e o log de auditoria funcionando de fato — não apenas presentes no código.
