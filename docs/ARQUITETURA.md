# Arquitetura e funcionalidades

Documento técnico do Caderno Digital: como o app é organizado, onde cada coisa
mora e o que cada área faz. Para instalar e publicar, veja o
[README](../README.md) e o [guia de deploy](DEPLOY.md).

## Visão geral

Aplicação **100% no navegador** (SPA em React + TypeScript, empacotada com Vite).
Não há servidor nem API: os dados ficam em **IndexedDB**, acessado pela
biblioteca Dexie, e o app funciona offline como PWA.

```
┌──────────────────────────── Navegador ────────────────────────────┐
│  React (components)  ──►  zustand (estado de UI, em memória)      │
│        │                                                           │
│        ▼                                                           │
│  src/db/*.ts  ──►  Dexie  ──►  IndexedDB "caderno-digital"        │
│                                                                    │
│  Excalidraw (camada de desenho por página, JSON em page.excalidrawData)
│  Service worker (public/sw.js): cache do app para uso offline      │
└────────────────────────────────────────────────────────────────────┘
```

## Camadas e regras

| Camada | Pasta | Regra |
|---|---|---|
| Dados | `src/db/` | **Único lugar** que importa o `db` (Dexie). Trocar IndexedDB por uma API REST + PostgreSQL deve mexer só nesses arquivos. |
| Estado de UI | `src/store/` | zustand, só em memória: seleção atual, filtros, janelas abertas, cores recentes. Nada aqui é persistido. |
| Componentes | `src/components/` | Uma pasta por área (layout, binder, notebook, excalidraw, richtext, hierarchy, rename, about). |
| Utilitários | `src/utils/` | Funções puras (datas, nomes, filtros, exportação). |
| PWA | `src/pwa/`, `public/sw.js` | Registro do service worker (só em produção) e aviso de instalação. |
| Estilos | `src/styles/` | Variáveis de tema, regras de toque/PWA e estilos da folha. Pontos de corte documentados em `theme.css`. |

## Modelo de dados

Banco `caderno-digital` (Dexie, `version(1)`), definido em `src/db/db.ts`:

| Tabela | Índices | Conteúdo |
|---|---|---|
| `subjects` | `id, name` | Matérias |
| `topics` | `id, subjectId, name` | Tópicos de uma matéria |
| `pages` | `id, number, subjectId, topicId, isFavorite, title, date` | Páginas: título, data, estilo da folha e o desenho (`excalidrawData`, JSON com elementos, appState e arquivos) |
| `meta` | `key` | Contador global de páginas (`pageCounter`) |

- Os tipos estão em `src/types.ts`.
- `pageCounter` só cresce: números de páginas excluídas não são reutilizados.
- Excluir uma matéria apaga seus tópicos e páginas numa única transação (`deleteSubject`).
- A **busca** (`src/db/search.ts`) carrega tudo em memória e filtra no JavaScript. Basta para um caderno pessoal, mas não escala para milhares de páginas pesadas.
- **Mudar o schema:** adicione `this.version(2).stores({...})` com `upgrade()`, sem alterar a versão 1, para não quebrar quem já tem dados salvos.

## Estrutura de pastas

```
src/
  types.ts                 modelos (Subject, Topic, Page)
  db/                      camada de dados (Dexie)
  store/                   estado de UI (zustand)
  hooks/                   useAutosave, useMediaQuery, useDrawerGestures
  pwa/                     registro do service worker, aviso de instalação
  styles/                  theme.css, mobile.css, paper.css, global.css
  utils/                   datas, nomes, filtros, exportação, tipos de conteúdo
  components/
    layout/                AppShell, Sidebar, TopBar, listas e filtros
    binder/                fichário: divisórias das matérias, abas dos tópicos
    hierarchy/             árvore Matéria > Tópico > Página
    notebook/              a folha: cabeçalho, navegação entre páginas
    excalidraw/            camada de desenho, barra de ferramentas, painel de propriedades
    richtext/              editor de texto formatado (vira elementos do Excalidraw)
    rename/                janela de renomear
    about/                 janela "Sobre e créditos"
public/                    manifest, ícones, service worker, _headers, licenças de terceiros
scripts/                   generate-licenses.mjs
docs/                      esta documentação
```

## Funcionalidades

- Hierarquia completa (criar/renomear/excluir matéria, tópico e página),
  com contagem de páginas e árvore expansível na sidebar.
- Numeração global e sequencial de páginas começando em 0, sem reuso de
  números após exclusão (contador em `src/db/db.ts`).
- Folha com cabeçalho (matéria/tópico/data em fonte manuscrita) e área de
  escrita rica (negrito, itálico, títulos, listas, código, alinhamento).
- Camada Excalidraw real sobre a folha, com estado próprio por página
  (elementos + appState salvos em `page.excalidrawData`), preservado ao
  trocar de página.
- Canvas único: texto, desenho e formas vivem como elementos do Excalidraw
  (não há mais modos Desenhar / Mapa Mental na barra superior).
- Três estilos de folha por página — pautada, branca e quadriculada —
  escolhidos pelo menu "Editar folha" no canto superior direito da faixa de tópico e título
  (`page.paperStyle`, estilos em `src/styles/paper.css`).
- O fundo branco/preto da folha é escolhido no mesmo menu; sua preferência é global,
  persistente e independente do tema da interface (`hooks/usePaperTone.ts`).
- Ícones da interface com Bootstrap Icons (`bootstrap-icons`, importado em
  `src/main.tsx`).
- Autosave com indicador "Salvando... / Salvo" (debounce de 600ms).
- Persistência real em IndexedDB — os dados sobrevivem a um refresh da
  página.
- Navegação entre páginas do mesmo tópico (← Página X de Y →).
- "Salvar como" na barra superior: Imprimir (A4), PDF e Imagem (PNG) da folha
  aberta (`src/utils/exportPage.ts`). A busca da barra superior foi removida.
- "Travar tela" (menu ⋯ da barra de ferramentas): além de congelar pan/zoom,
  mostra uma borda na folha e impede que elementos movidos, criados ou colados
  saiam dela até destravar (`src/components/excalidraw/canvasBounds.ts`).
- Caixa de edição de objetos no formato do painel do Excalidraw
  (`src/components/excalidraw/ElementContextPanel.tsx`): contorno, fundo,
  preenchimento, espessura, estilo do traço, irregularidade, bordas, tipo e
  pontas de seta, fonte / tamanho / alinhamento (horizontal e vertical),
  opacidade, camadas, alinhar/distribuir, agrupar, link, bloquear, duplicar e
  excluir. Com uma ferramenta de desenho ativa e nada selecionado, ela edita o
  padrão dos próximos elementos. O seletor de cor segue o esquema do Excalidraw
  (atalhos rápidos, matizes com 5 tons, código hex e conta-gotas); a paleta
  está em `colorPalette.ts` e a lógica de o que aparece/aplica em
  `propertyModel.ts`. O painel nativo do Excalidraw fica escondido por CSS.
- Favoritos, com view dedicada na sidebar.
- Layout responsivo básico (sidebar vira drawer em telas estreitas).
- **Sobre e créditos** (`components/about/AboutDialog.tsx`, aberto pelo rodapé do menu
  lateral): crédito do Excalidraw (MIT, © 2020 Excalidraw), fontes e bibliotecas, com
  link para `/third-party-licenses.txt`. Esse arquivo é gerado a cada build por
  `scripts/generate-licenses.mjs` a partir do `node_modules` (só dependências de produção).

## Texto formatado, marcadores e travar tela

- **Texto formatado** (`src/components/richtext/`): a ferramenta "Texto" da barra
  (e o duplo clique numa área vazia, numa forma ou num texto) abre um editor com
  **negrito, itálico**, sublinhado, **cor por palavra/letra**, biblioteca de
  marcadores e numeração (•, ◦, ▪, ◆, ➤, ✓, ★, –, ☐, 1., 1), a), A., i., I.),
  recuo (Tab / Shift+Tab), alinhamento, fonte, **tamanho com contador** e
  **espaço entre linhas**. Em telas largas (> 900px) o editor é um **painel na
  coluna à esquerda da folha** (fora dela; o painel de propriedades segue à
  direita); no celular continua uma barra flutuante no topo.
  O Excalidraw só guarda um estilo por texto, então o resultado vira um **grupo
  de elementos nativos** (`native.ts`): um retângulo invisível (a "caixa", com o
  conteúdo em `customData.rich`) + um elemento `text` para cada trecho de mesma
  cor em cada linha + um `text` para cada marcador + uma linha fina para cada
  trecho sublinhado (todos com `customData.richPart`). O texto é vetorial,
  seleciona, move, agrupa, trava e exporta como qualquer objeto, e funciona
  dentro de formas (agrupado com elas). Ao redimensionar o bloco, o texto
  reflui na nova largura e as peças são refeitas.
- **Negrito e itálico** não existem no texto nativo do Excalidraw, então são
  simulados: o **negrito** escreve o trecho duas vezes com menos de 1px de
  diferença (continua texto nativo); o **itálico** vira uma pequena imagem PNG
  só daquele trecho, dentro do grupo (a fonte é inclinada pelo navegador).
  Trechos em itálico, portanto, não são texto selecionável. Textos antigos (que
  eram uma única imagem PNG) continuam aparecendo e abrindo normalmente; ao
  serem editados viram o grupo nativo.
- Um bloco girado não refaz o layout ao redimensionar, e a edição pelo painel
  (`Tamanho do texto`, `Espaço entre linhas`) refaz o grupo inteiro. Cor, fonte
  e fundo do painel não valem para as peças do texto formatado (use o editor).
- O banco não guarda mais elementos apagados da cena (só servem ao desfazer da
  sessão); sem isso cada edição de texto deixaria dezenas de peças antigas no JSON.
- As imagens da página (inclusive textos formatados antigos) são salvas junto
  com a cena (`files` no JSON) e o salvamento é adiado em 400 ms (`SAVE_DELAY_MS`).
- O seletor de símbolos foi removido; os marcadores ficam no editor de texto.
- **Travar tela**: os objetos param a 8px da borda (folga para as alças ficarem
  alcançáveis), tolerância de 0,5px contra deslocamentos mínimos, e texto solto
  e elementos girados também são limitados ao redimensionar.

## Fichário (troca de folhas) e barra superior

- **Divisórias das matérias** (`components/binder/SubjectTabs.tsx`): uma aba
  colorida por matéria na borda direita da folha, com atalhos **Início / Todas
  as páginas / Favoritos** no topo. Clicar volta para a última página aberta
  na matéria; matéria sem páginas abre o menu lateral. A cor vem do id da
  matéria (`binder/colors.ts`), sem campo novo no banco.
- **Abas dos tópicos** (`TopicTabs.tsx`): "orelhas de pasta" em cima da folha,
  com a aba aberta na cor do papel. Clicar volta para a última página do tópico.
- **Troca de páginas** (`notebook/PageNavigator.tsx`, na barra superior): faixa
  de folhas numeradas (7 por vez, com … quando há mais), setas, **+** para uma
  página nova no tópico e estrela nas favoritas. No celular vira `2/5`, que abre
  a lista completa. Atalho: **Alt+Shift+← / →**. A folha faz um fade rápido ao
  trocar de página.
- A última página aberta por matéria/tópico fica só em memória (`notebookStore`).
- **Barra superior** menor (`--topbar-h`: 48px no computador, 52px no celular, onde os botões têm 44px).
- Os ícones de **alinhar objetos** foram redesenhados (linha de referência +
  barras cheias, no estilo do Excalidraw).

## Mobile-first e PWA

**Pontos de corte** (documentados em `src/styles/theme.css`): ≤480 celular estreito ·
≤640 celular · **≤900 layout mobile** · ≥901 painéis laterais · ≥1180 barra de
desenho na barra superior. Variáveis de tema novas: `--touch-min` (44px),
`--safe-top/right/bottom/left` (entalhe e barra de gestos), escala de camadas
`--z-*` e tempos de animação. Regras globais de toque/PWA ficam em
`src/styles/mobile.css`.

- **Gaveta (menu)**: abre pelo botão ☰ ou **arrastando da borda esquerda**; fecha
  arrastando para o lado, tocando no fundo ou com Esc (`hooks/useDrawerGestures.ts`).
  Fechada, fica fora do alcance do teclado e de leitores de tela. Tem botão
  **Instalar app** quando o navegador oferece.
- **Divisórias (fichário)**: matérias numa faixa à direita da folha e tópicos numa
  faixa que **rola com o dedo** (snap suave) em cima. Cada aba tem 44px de área de
  toque (o corpo colorido é menor, o resto é área transparente). Com um tópico só,
  a faixa de tópicos some no celular para dar altura à folha.
- **Doca de desenho** (`DrawToolbar`): fixa no pé da tela, de ponta a ponta, uma
  fileira de botões de 44px que rola (desfazer/refazer na frente; a ferramenta
  ativa é trazida para a vista). A alça fina no topo recolhe a doca. A folha
  termina logo acima dela (`--mobile-toolbar-h`).
- **Doca do editor de texto** (`RichTextEditor`): no celular a barra de formatação
  fica no pé da tela, **encostada no teclado virtual** (medido pelo
  `visualViewport`), com Cancelar/Concluir fixos à esquerda; Cor e Marcadores
  abrem numa folha logo acima. O texto sobe sozinho para não ficar embaixo da doca.
- **Alvos de toque de 44px**: menu, "Salvar como", navegação de páginas, árvore
  de matérias, divisórias, doca, steppers e painel de propriedades. Exceção: as
  cores das paletas (34px), que são muitas e ficam lado a lado.
- **PWA**: `public/manifest.webmanifest`, ícones em `public/icons/`, e
  `public/sw.js` (offline: HTML com rede primeiro; `/assets/*` e ícones em cache;
  fontes de outros domínios com "stale-while-revalidate"). O registro
  (`src/pwa/register.ts`) só roda no app publicado (`npm run build`), não no
  `npm run dev`. Para soltar uma versão nova, troque `VERSION` em `public/sw.js`.
  O app abre em tela cheia respeitando as margens seguras (`viewport-fit=cover`).
- **Limite do offline**: os dados ficam no aparelho (IndexedDB) e funcionam sem
  internet, mas o Excalidraw busca suas fontes de desenho em um CDN; elas só
  aparecem offline depois de terem sido abertas uma vez com internet.

## Folha fluida e faixas de largura

Antes, entre 901 e 1279px (inclusive o modo "site para computador" do celular, ~980px)
as duas colunas laterais reservavam ~600px mesmo vazias, e a folha ficava com ~320px
no meio de um fundo preto. Agora:

- **Folha fluida** (`NotebookPage.css`): `width: 100%` limitada só por `--sheet-max-w`
  (1440px, em `theme.css`) e **nunca mais baixa que a altura útil da tela**
  (`--sheet-min-h` = viewport − barra superior − respiros), então em telas altas
  ela cresce para preencher. Margens internas proporcionais (`clamp`).
- **Três faixas**: ≥1280px, 3 colunas simétricas (editor de texto | folha |
  propriedades) — a folha não pula quando um painel abre; 901–1279px, folha na
  largura toda e **painéis flutuando** sobre ela (`position: fixed`); ≤900px, celular.
- **Doca de ferramentas até 1179px** (antes, só ≤900px): de ponta a ponta no pé da
  tela, e a folha termina acima dela (`--mobile-toolbar-h`, que passa a valer 0
  quando a barra está no topo). O `z-index` da doca é relativo à `.topbar`, então é
  sempre o mesmo, em qualquer resolução ou zoom.
- **Cabeçalho da folha** (`PageHeader.css`): reage à largura da *folha* (container
  query), não da tela — 3 colunas (≥620px), 2 linhas (460–619px) ou só o Tópico
  (<460px). Colunas `minmax(0, …)` e reticências: texto longo não invade mais o
  rótulo nem o campo vizinho; `title` mostra o texto inteiro.
- `AppShell`: sem `100vw` (incluía a barra de rolagem); `100dvh` com reserva em `vh`.

## Filtrar páginas e renomear tudo

**Filtros** (telas "Todas as páginas" e "Favoritos", `layout/ListFilters.tsx`):
busca (título, número, matéria e tópico — sem diferenciar acento; "pagina 12" ou
"#12" vai direto à página), **matéria** e **tópico**, **período** (atalhos Hoje /
7 dias / 30 dias / Este mês / Este ano, ou De–Até), **tipo de folha** (pautada,
branca, quadriculada), **conteúdo** (texto, desenho, formas, imagem, vazia — vem
dos elementos do Excalidraw, ver `utils/pageKinds.ts`) e só favoritas. A **ordem**
é por número, data da página, título (A–Z) ou última edição, crescente ou
decrescente. Mostra "N de M páginas", os filtros ligados como etiquetas que se
removem com um toque e "Limpar filtros". Os filtros ficam guardados ao abrir uma
página e voltar (`notebookStore`). A lógica é pura e testável em
`utils/pageFilters.ts`. A data usada é a do cabeçalho da página (aceita
`04 / 10 / 2026`, `4-10-26`…); se não for uma data válida, vale a de criação.

**Renomear** matérias, tópicos e páginas, de vários lugares:
- **Menu lateral (árvore)**: lápis em cada linha (aparece ao passar o mouse; sempre
  visível no toque) ou duplo clique; Enter salva, Esc cancela.
- **Divisórias e abas de tópico**: duplo clique, botão direito ou **segurar o dedo**.
- **Título da página**: fica **fora da folha**, na faixa das abas de tópico, logo à
  direita da aba (`binder/PageTitle.tsx`) — não ocupa área de escrita. Clique e
  escreva; Enter ou sair do campo salva, Esc desfaz. No celular a faixa fica rente
  à folha (e, deitado, só aparece quando já existe um título).
- **Cabeçalho da folha**: lápis ao lado de Matéria e Tópico abrem a janela de
  renomear.
- **Cartões das listas**: lápis no canto.
- Janela única (`rename/RenameDialog.tsx`): avisa nome repetido de matéria (e de
  tópico dentro da mesma matéria, sem diferenciar maiúsculas/acentos), limite de
  80 caracteres (120 no título da página), título vazio permitido só na página.
