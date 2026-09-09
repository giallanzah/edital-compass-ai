# Cadastro com aprovação para Consultor e Equipe

## Comportamento final
- **Empresa / Empreendedor**: cadastro liberado na hora. Após criar a conta (ou confirmar o e-mail), o usuário entra e vai para `/portal/onboarding`.
- **Consultor Especialista** e **Equipe Fomenta**: a conta é criada, mas o acesso fica **em análise**. Nada de redirecionamento: a própria tela mostra o aviso
  "Cadastro recebido! Seu perfil de Consultor está em análise. Nossa equipe entrará em contato em breve para liberar seu acesso." (troca para "Equipe" no card administrativo).
- Nenhum papel de consultor/admin é concedido no cadastro — a liberação continua sendo feita pela equipe no backoffice.
- Quem já tem solicitação pendente e tenta entrar como Consultor/Equipe vê o mesmo aviso de análise, em vez da mensagem genérica de "conta não credenciada".

## O que muda no banco
- Nova tabela **solicitacoes_acesso**: quem pediu (usuário), perfil desejado (consultor ou equipe), nome, e-mail, situação (pendente / aprovada / recusada), observação da equipe e data de decisão.
- Regras de acesso:
  - a pessoa pode criar a própria solicitação e ver apenas a dela;
  - administradores (ADMIN e SUPER_ADMIN) podem ver todas e mudar a situação;
  - ninguém pode apagar registros.
- Nenhuma tabela existente é alterada; nada é removido.

## O que muda na tela
`src/routes/entrar.tsx`:
- Os três cards passam a permitir o cadastro completo (nome, e-mail, senha) — hoje Consultor e Equipe só mostram um aviso bloqueando o formulário.
- No envio do cadastro:
  - empreendedor → fluxo atual (redireciona ou pede confirmação de e-mail);
  - consultor/equipe → cria a conta, registra a solicitação pendente, encerra a sessão e exibe o aviso de análise, sem sair da tela.
- No login: se o perfil escolhido for consultor/equipe e o usuário ainda não tiver o papel, verifica se existe solicitação pendente e mostra o aviso de análise.

## Detalhes técnicos
- Migração cria `public.solicitacoes_acesso` com `user_id`, `perfil` (`consultor` | `admin`), `nome`, `email`, `status` (`pendente` | `aprovada` | `recusada`), `observacao`, `decidido_em`, `created_at`, `updated_at`, mais `GRANT` para `authenticated`/`service_role`, RLS ativa, policies com `auth.uid()` e `has_role(...)`, índice único parcial por `user_id` + `perfil` para status `pendente`, e trigger `set_updated_at`.
- Novo `src/lib/acesso.functions.ts`:
  - `criarSolicitacaoAcesso` (`requireSupabaseAuth`) — grava a solicitação usando a sessão recém-criada;
  - `minhaSolicitacaoPendente` (`requireSupabaseAuth`) — usado no login para detectar análise em andamento.
- Fluxo signup de consultor/equipe: `signUp` → se houver sessão, chama `criarSolicitacaoAcesso` e depois `supabase.auth.signOut()`; se não houver sessão (confirmação de e-mail ativa), a solicitação é criada no primeiro login com o perfil desejado guardado em `user_metadata.perfil_desejado`.
- `destinoPorRole()` permanece como está; nenhuma rota nova.
