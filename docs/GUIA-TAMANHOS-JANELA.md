# Guia de tamanhos — "quero mudar X, onde mexo?"

**Regra única:** tamanho, formato, fonte e espaço de qualquer elemento listado aqui são
*tokens* em `src/styles/theme.css`. Os arquivos `.css` dos componentes só **leem** esses
tokens. Lista completa (computador × tablet × celular): [`MAPA-DE-TOKENS.md`](MAPA-DE-TOKENS.md).

Cada seção do `theme.css` tem o valor do computador no bloco `:root` e, quando o celular usa
outro, o mesmo nome na **seção 15** (blocos `@media`). Mude o valor no lugar certo e pronto.

## Receitas

| Quero mudar… | Token(s) no theme.css | Seção |
|---|---|---|
| Largura da folha / proporção / cantos / sombra | `--sheet-max-w`, `--sheet-aspect-ratio`, `--sheet-radius`, `--sheet-shadow` | 3 |
| Margem interna da folha | `--sheet-content-pad-top/-x/-bottom` | 3 |
| Espaço em volta da folha | `--layout-page-pad-top/-left/-right/-bottom`, `--tabs-gutter` | 3 |
| Estrela de favorito | `--sheet-fav-top/-left/-size/-hit` | 3 |
| **Matérias** (divisórias): largura, altura, cantos, fonte | `--subject-tab-w`, `-w-hover`, `-w-active`, `-h`, `-radius`, `-font-size`, `--subject-tabs-w`, `--subject-tabs-gap` | 4 |
| **Atalhos** (Início / Todas / Favoritos): altura, ícone, cores | `--shortcut-h`, `--shortcut-icon-size`, `--shortcut-bg/-fg`, `--shortcut-active-bg` | 5 |
| **Tópicos** (abas): altura, largura máx., fonte, cantos | `--topic-tab-height`, `-active-height`, `-max-w`, `-font-size`, `-radius`, `-pad-x` | 6 |
| **Nome da página** (título ao lado das abas) | `--page-title-font-size`, `-height`, `-max-w`, `-icon-size`, `-gap` | 7 |
| Cabeçalho (Matéria · Tópico · Data) | `--page-header-label-size`, `-value-size`, `--page-header-mobile-*` | 8 |
| Barra superior | `--topbar-h`, `--topbar-btn-size`, `--topbar-menu-btn-size`, `--topbar-action-*` | 9 |
| Menu esquerdo (gaveta) | `--main-drawer-width`, `--sidebar-*` | 2, 10, 11 |
| **Caixa de texto** (negrito, cor, marcadores, Tamanho…) | `--rte-*` | 12 |
| Contador `− 20 +` | `--rte-stepper-*` | 12 |
| **Caixa de formas** (contorno, preenchimento, traço…) | `--ecp-*` | 13 |
| **Barra de desenho** (retângulo, losango, elipse…) | `--draw-*` | 14 |

Celular deitado: `--topbar-h` na última regra do `theme.css` (hoje 50px, igual ao celular em pé;
o `mobile.css` antigo pedia 46px, mas nunca valeu).

## Onde fica cada coisa (arquivo → o que ele cuida)

| Arquivo | Cuida de |
|---|---|
| `styles/theme.css` | **todas as medidas e cores** (único lugar para mexer em tamanho) |
| `styles/global.css`, `mobile.css`, `paper.css` | reset, toque no celular, pauta/quadriculado |
| `binder/SubjectTabs.css` | matérias + atalhos |
| `binder/TopicTabs.css`, `PageTitle.css` | abas de tópico, nome da página |
| `notebook/NotebookPage.css`, `PageHeader.css`, `PageMenu.css` | folha, cabeçalho, menu ⋯ |
| `richtext/RichTextEditor.css`, `Stepper.css` | caixa de ferramentas de texto (mapa de 7 partes no topo) |
| `excalidraw/ElementContextPanel.css` | caixa de ferramentas de formas (mapa de 6 partes no topo) |
| `excalidraw/DrawToolbar.css` | barra de desenho: computador → doca → cápsula do celular |
| `layout/TopBar.css`, `AppShell.css` | barra superior (com a versão do celular no fim do arquivo) |

## Regras para não voltar a sobrepor

1. **Não crie regra de tamanho em outro arquivo** para um elemento que já tem token. Se faltar um
   botão de ajuste, crie o token no `theme.css` (com comentário) e leia-o no componente.
2. **Ordem dentro de cada arquivo:** base (computador) → tablet → celular. Nada carrega depois.
3. **Não existe mais CSS "por cima"** (`mobile-ui.css` e `accessibility.css` foram absorvidos).
   `main.tsx` importa `styles/global.css` **antes** do `App`.
4. **Alvo de toque de 44px** é `--touch-min`; não escreva `44px` solto.
5. Rode `npm run check:css` (também roda no `npm run build`): ele falha se um token for usado sem
   existir, se sobrar token que ninguém lê, ou se a ordem de import voltar a ser a errada.
6. Mudou tokens? `npm run docs:tokens` regenera o `MAPA-DE-TOKENS.md`.
