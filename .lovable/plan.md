# Correção da logo + ciclo de melhorias de experiência

## 1. A logo do header (diagnóstico confirmado)

Verifiquei o site publicado, o preview e o ambiente local: o arquivo da logo **carrega normalmente** (HTTP 200 nos três). O erro é visual, não de carregamento:

- A imagem original tem 1408x768 px com muita margem branca em volta e é renderizada com apenas 32 px de altura. Resultado: a marca aparece minúscula, borrada e o texto "fomenta.ai" fica ilegível.
- O arquivo pesa 806 KB — muito grande para um elemento de 59x32 px, e é baixado em toda página.
- É um PNG com fundo branco, então ele não se adapta a fundos escuros nem ao tema escuro.

### Solução proposta

Substituir a imagem única por um **lockup montado no código**:

- Símbolo da marca como SVG/PNG recortado (só o ícone, sem margem, com fundo transparente), em ~28 px.
- Palavra "fomenta" + ".ai" renderizada com a tipografia do próprio sistema de design, usando os tokens de cor. Fica nítida em qualquer tamanho, acessível, e funciona em fundo claro e escuro.
- Variantes do componente: `full` (header do site), `compact` (header do portal/admin) e `mark` (apenas símbolo, para favicon e mobile).
- Gerar também favicon e ícone de aba, hoje ausentes.
- Remover o PNG pesado do carregamento das páginas.

Alternativa, caso você prefira manter exatamente a arte original: recortar a margem branca, gerar uma versão em PNG transparente com no máximo ~60 KB e exibi-la maior (36-40 px de altura). Menos flexível, mas 100% fiel ao arquivo enviado.

## 2. Melhorias de experiência encontradas

### Navegação e acesso
- **Sem menu no celular**: o header público esconde toda a navegação em telas pequenas e não oferece menu alternativo. Adicionar menu deslizante com os links e o botão de acesso.
- **"Entrar" e "Acessar plataforma" levam ao mesmo lugar** e competem entre si. Manter um botão primário e transformar "Entrar" em link discreto de retorno para quem já tem conta.
- **Links âncora "Plataforma" e "Planos"** só funcionam na home; a partir de páginas internas eles não fazem nada. Corrigir para voltar à home na seção certa.
- **Após entrar, o destino é fixo**: o usuário sempre cai no mesmo painel independentemente do papel. Encaminhar automaticamente para portal, área do consultor ou backoffice conforme o perfil, e devolver para a página que ele tentou acessar antes do login.

### Descoberta de editais
- **Busca e filtros sem persistência**: ao voltar do detalhe de um edital, os filtros se perdem. Guardar filtros na URL, o que também torna as buscas compartilháveis.
- **Sem estados de carregamento reais**: listas trocam de vazio para preenchido sem transição, o que parece travamento. Adicionar esqueletos de carregamento e estados vazios com ação sugerida.
- **Prazo pouco visível na listagem**: hoje a urgência só aparece nas candidaturas. Levar o indicador de dias restantes para os cartões do catálogo.
- **Sem salvar/favoritar** um edital sem já criar uma candidatura. Adicionar "salvar para depois".

### Acompanhamento
- **Kanban sem feedback de erro**: se o arraste falhar, o cartão volta sem explicação. Adicionar confirmação e desfazer.
- **Checklist e proposta de IA sem indicação de progresso** durante a geração, que pode levar segundos. Adicionar estado de processamento e mensagem de erro clara.
- **Sem visão consolidada de próximos prazos** na página inicial do portal. Incluir bloco "próximos 30 dias".

### Consistência geral
- **Mensagens de erro técnicas** aparecem cruas em algumas telas do backoffice. Padronizar em linguagem simples com ação de tentar novamente.
- **Acessibilidade**: foco visível, textos alternativos e contraste dos elementos discretos precisam de revisão.

## 3. Ordem sugerida de execução

1. **Logo e identidade** (correção do erro): novo componente de marca, favicon, remoção do PNG pesado.
2. **Navegação**: menu mobile, hierarquia dos botões de acesso, âncoras, redirecionamento por perfil após login.
3. **Descoberta**: filtros na URL, esqueletos, prazo no cartão, salvar edital.
4. **Acompanhamento**: feedback no kanban, estados da IA, bloco de próximos prazos.
5. **Polimento**: mensagens de erro e acessibilidade.

## Detalhes técnicos

- `src/components/Logo.tsx` passa a aceitar `variant: "full" | "compact" | "mark"`; símbolo em SVG inline com `currentColor`, wordmark em texto com tokens (`--foreground`, `--muted-foreground`). O ponteiro `src/assets/fomenta-logo.png.asset.json` deixa de ser referenciado no header (mantido em disco para uso em og:image se desejado).
- Favicon e `apple-touch-icon` declarados no `head()` de `src/routes/__root.tsx`.
- Menu mobile em `src/components/SiteHeader.tsx` usando o `Sheet` do shadcn já disponível.
- Filtros do catálogo migram para `validateSearch` da rota `/portal/editais`, lidos via `useSearch`.
- Redirecionamento por perfil em `/entrar` consulta a server function `meuRole` já existente antes de navegar.
- Nenhuma mudança de banco de dados é necessária, exceto se aprovarmos "salvar edital", que exige uma tabela nova de favoritos com regras de acesso por dono.
