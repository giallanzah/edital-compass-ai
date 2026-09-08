# Refatoração visual da tela de Cadastro (Sign Up)

## Objetivo
Transformar a escolha de perfil na tela `/entrar` (modo signup) de botões simples em uma seleção por 3 cards clicáveis, com o formulário de e-mail/senha aparecendo abaixo do card selecionado.

## O que será alterado
- `src/routes/entrar.tsx`: refatorar a seção de modo `signup`.
- Estilização com Tailwind v4, respeitando o tema mono existente (`hairline`, `bg-background`, `text-foreground`, etc.).
- Nenhuma regra de banco de dados, RLS, auth ou rota será alterada.

## Detalhes da nova interface
1. Ao entrar no modo "Criar conta", o usuário vê o título:  
   **"Como você deseja atuar na Fomenta.ai?"**
2. Três cards de seleção:
   - **Card 1 — Empresa / Empreendedor**  
     Subtítulo: "Quero captar recursos de fomento para meus projetos."
   - **Card 2 — Consultor Especialista**  
     Subtítulo: "Quero ajudar empresas a aprovar projetos e monetizar minha expertise."
   - **Card 3 — Equipe Fomenta**  
     Subtítulo: "Acesso administrativo (requer aprovação)."
3. Layout dos cards: lado a lado no desktop (3 colunas), empilhados no mobile (1 coluna).
4. Estado visual do card selecionado: borda destacada (`border-foreground`) e fundo sutil (`bg-secondary`).
5. Ao clicar em um card, o formulário padrão de e-mail e senha (e nome, no signup) é renderizado logo abaixo dos cards, mantendo o aviso existente para Consultor e Equipe Fomenta.
6. Regras de negócio atuais são preservadas:
   - Empreendedor permite cadastro completo.
   - Consultor e Admin exibem apenas o aviso de credenciamento/aprovação interna.
   - O link "Já tem conta? Entrar" continua alternando para o modo login.

## Validação
- Verificar visualmente a tela `/entrar` no modo "Criar conta".
- Confirmar responsividade entre desktop e mobile.
- Garantir que o build (`build:dev`) e o typecheck continuem limpos.
