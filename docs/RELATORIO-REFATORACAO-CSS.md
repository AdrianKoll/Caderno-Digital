# Relatório — refatoração do CSS (theme.css como fonte única)

## Por que o theme.css "não mudava nada"
1. **Ordem de carga:** os CSS dos componentes entravam no bundle *antes* de `mobile-ui.css` e
   `accessibility.css`; em empate de especificidade, o último vence. `mobile-ui.css` (488 linhas)
   reescrevia folha, divisórias, barra superior e barra de desenho no celular.
2. **Valores do theme.css que nunca chegavam à tela** (medidos no navegador): `--topbar-h`
   (theme 52px / mobile.css 46px / mobile-ui 50px → valia 50), `--sheet-content-pad-top` no celular
   (theme 10px, real 6px), regras de folha para ≤380px e celular deitado (nunca aplicadas),
   mínimos de 44px do `accessibility.css` por cima de `--topbar-control-size`.
3. **Áreas sem token:** matérias/atalhos (39 px soltos, 2 tokens), painel de formas (94/5),
   caixa de texto (98/19), barra de desenho (64/14), `mobile-ui.css` (103/5). Havia 8 tokens
   `--rte-stepper-*` no theme que o `Stepper.css` nunca lia (e um com valor diferente do real).
4. Havia 51 seletores definidos em mais de um arquivo, 17 tokens sem uso e valores inválidos
   (`--sidebar-input-pad-y: 0x`).

## O que mudou
- `theme.css` reorganizado em 15 seções numeradas, índice no topo, **358 tokens** comentados.
  Valores do celular na seção 15, com os mesmos nomes.
- Folha, matérias, atalhos, tópicos, nome da página, cabeçalho, caixas de texto e de formas,
  barra de desenho e barra superior leem **só tokens**.
- `mobile-ui.css` e `accessibility.css` removidos (conteúdo absorvido por componente + tokens).
- Código morto removido: `::before` das divisórias no celular, regras de celular do `PageTitle`,
  container queries/paisagem do `PageHeader`, blocos de ≤380px e paisagem da folha.
- `main.tsx`: estilos antes do `App`. Novos: `npm run check:css`, `npm run docs:tokens`.

## Verificação (build novo × build original)
- Medição de estilos computados em 7 tamanhos de tela × tema claro/escuro, ~70 seletores mais
  maquetes das caixas de texto e de formas: **0 diferenças visuais** (4 diferenças só em
  `grid-template-columns` do `.page-header`, que no celular já é flex e ignora a propriedade).
- Capturas de tela em 7 tamanhos: **0 pixels diferentes**.
- Teste de ajuste: alterar só tokens (largura/altura de matéria, altura de atalho, abas, fonte do
  título, raio da folha, altura da barra superior) mudou a tela no computador e no celular.
- Não testado: estados `:hover`/`:focus`, o editor de texto e o painel de formas abertos de
  verdade (testei maquetes com as mesmas classes), e aparelhos reais.

## Decisão pendente
Celular deitado: mantido 50px (igual ao celular em pé). Para 46px, mude `--topbar-h` no último
bloco do `theme.css`.
