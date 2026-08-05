# Sincronizar mudanças externas para dentro da Lovable

Objetivo: fazer com que alterações de código feitas fora daqui (GitHub / IDE local, repositório `edital-compass-ai`) apareçam neste projeto, com uma forma clara de visualizar o que mudou.

## O que eu verifiquei agora

- O repositório deste projeto está no Git interno da Lovable. O único remote configurado no ambiente é o storage da Lovable — **não há remote do GitHub visível daqui**.
- Branch de trabalho e `main` estão idênticos: `0` commits à frente, `0` atrás, nenhuma alteração pendente.
- Os últimos commits são todos meus/da plataforma (o mais antigo de fora é de 27/07). **Nenhuma alteração externa chegou até agora.**

Conclusão: hoje não existe caminho ativo para mudanças externas entrarem. Precisamos ligar o canal antes de sincronizar qualquer coisa.

## Passo 1 — Ligar o GitHub (ação sua, no menu da Lovable)

Isso não é código: eu não consigo criar nem conectar o repositório por você.

1. No editor, abra o menu **+** (canto inferior esquerdo do chat) → **GitHub** → **Connect project**.
2. Autorize o app da Lovable no GitHub e escolha a conta/organização.
3. Se o repositório `edital-compass-ai` **ainda não existe**: clique em **Create Repository** — a Lovable cria o repo já com todo o código atual do projeto.
4. Se o repositório **já existe com o seu código**: a Lovable hoje não importa repositórios existentes. Nesse caso, veja a alternativa no Passo 1B.

Depois disso a sincronização é **bidirecional e automática**: push no GitHub → chega aqui; mudança minha aqui → vai pro GitHub. Sem pull manual.

### Passo 1B — Se você já tem código só no GitHub

Duas opções, você escolhe depois de conectar:

- **Repo novo da Lovable como fonte da verdade** (recomendado): criar o repo pela Lovable, clonar localmente e reaplicar por cima as suas mudanças externas via commit/push. É o caminho mais limpo.
- **Trazer arquivos pontuais**: você me diz quais arquivos mudaram e cola o conteúdo aqui; eu aplico no projeto. Serve para poucas mudanças, não para um merge grande.

## Passo 2 — Conferir o que chegou

Assim que houver push externo, eu faço a verificação aqui e te devolvo:

- Lista de commits novos (autor, data, mensagem).
- Arquivos tocados, agrupados por área (portal, admin, robô de coleta, banco).
- Alerta explícito se algum arquivo sensível foi alterado: `src/integrations/supabase/*` (gerado automaticamente), migrações do banco, `src/routeTree.gen.ts`, `.env`.
- Typecheck do estado final, para garantir que a mudança externa não quebrou o build.

## Passo 3 — Regras para não haver conflito

Para que os dois lados convivam sem sobrescrever trabalho:

- Não editar em paralelo o mesmo arquivo — quando você for mexer em algo fora, me avisa e eu paro naquela área.
- Arquivos gerados (`src/routeTree.gen.ts`, `src/integrations/supabase/types.ts`) devem ser alterados só de um lado; eu sempre regenero pelo banco.
- Migrações de banco só por aqui: o schema vive no Cloud e um `.sql` empurrado pelo GitHub não é aplicado sozinho.

## Detalhes técnicos

- A sincronização com o GitHub é feita pela plataforma, não pelo repositório do ambiente de execução — por isso não adianta eu adicionar um remote manualmente.
- O histórico atual tem 2 commits recentes de snapshot da plataforma (`Work in progress`, `Changes`) além do plano; o último commit de conteúdo real é `ba8ce77` (recuperação de senha do admin), de 27/07.
- Opcional, se você quiser acompanhar sem sair do app: posso depois criar `/admin/changelog` lendo a API do GitHub via connector, listando commits e arquivos alterados. Fica para uma etapa seguinte, se fizer sentido.

## Entregável desta etapa

Canal de sincronização ativo com o GitHub e um relatório de diferenças verificado por mim a cada push externo. Sem alteração de funcionalidade do produto.
