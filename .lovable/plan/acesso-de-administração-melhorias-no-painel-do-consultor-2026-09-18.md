# Acesso de administração + melhorias no painel do consultor

## Situação atual (verificada no banco)

- Existe **1 conta** na plataforma: hugo@loor.vc (confirmada, último acesso registrado).
- **Nenhum papel atribuído**: não há super admin, admin nem consultor cadastrado.
- Não há solicitações de acesso pendentes.
- juan@brasilstartups.org **ainda não tem conta**.
- O login funciona: a tela do backoffice concede super admin automaticamente à primeira conta que entrar, enquanto não existir nenhum administrador.

## O que será feito

### 1. Conta de super admin para o Juan
- Criar a conta juan@brasilstartups.org já confirmada, com senha provisória, e conceder o papel de super admin.
- A senha provisória será informada a você no chat, para ele trocar no primeiro acesso (há tela de recuperação de senha no backoffice).
- Garantir que o login por e-mail e senha esteja ativo na plataforma.

### 2. Confirmação do login
- Testar no navegador o acesso ao backoffice com essa conta e confirmar que a lista de administradores e a tela de solicitações abrem sem erro.
- Relatar os e-mails com acesso administrativo após a criação.

### 3. Melhorias no perfil do consultor
Pendências encontradas nas telas do consultor:

- **Sem página de perfil**: o consultor não consegue ver nem editar seus próprios dados (nome, telefone, especialidade). Criar "Meu perfil" no menu, com edição dos campos próprios.
- **Mensagem de acesso negado pouco útil**: quem se cadastrou como consultor e está aguardando aprovação vê "sem credencial", sem saber que o pedido está em análise. Passar a mostrar o status real do pedido (em análise / recusado / não solicitado) com o texto adequado.
- **Login errado**: a área do consultor manda para a tela de login do portal da empresa. Passar a usar a tela única de entrada, mantendo o retorno para a página que ele tentou abrir.
- **Dashboard sem ações do dia**: hoje só mostra contadores. Incluir as atividades em aberto e as que estão vencendo, com atalho direto para o cliente.
- **Créditos sem contexto**: mostrar contratados x utilizados, não apenas o restante.
- **Estados vazios**: quando o consultor ainda não tem clientes ou revisões, mostrar uma orientação em vez de listas vazias.

## Detalhes técnicos

- Criação do usuário via Auth Admin API (e-mail confirmado, senha provisória) e `INSERT` em `user_roles` com `SUPER_ADMIN`; `enable_email_auth` chamado no mesmo turno.
- Novas server functions em `src/lib/consultor.functions.ts`: `meuPerfilConsultor` / `atualizarMeuPerfilConsultor` (sob `requireSupabaseAuth`, escopo `user_id = auth.uid()`), e extensão de `dashboardConsultor` com atividades pendentes/vencendo e créditos contratados.
- Nova rota `src/routes/consultor.perfil.tsx` + item no `MENU` de `consultor.tsx`.
- `AccessDenied` em `consultor.tsx` passa a consultar `minhaSolicitacao` (`src/lib/acesso.functions.ts`) para exibir o status correto; redirecionamento passa para `/entrar` com `redirect`.
- Política de UPDATE em `consultores` restrita ao próprio `user_id` (hoje a tabela é somente leitura para o usuário), mantendo as demais regras.
- Verificação final com `bunx tsgo --noEmit`, `bun run build:dev` e checagem no navegador.
