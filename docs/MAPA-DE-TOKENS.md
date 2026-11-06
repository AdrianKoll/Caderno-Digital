# Mapa de tokens (gerado de `src/styles/theme.css`)

> Não edite este arquivo à mão: rode `npm run docs:tokens`. Para mudar um tamanho, edite o token no **theme.css** — a coluna *Celular* mostra o valor usado em telas de até 900px; *Tablet* até 1179px; *≥1280* em telas largas. Célula vazia = mesmo valor do computador.

## 1. CORES E TEMA (escuro é o padrão; o claro está mais abaixo)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--bg` | `#1d1b1b` |  |  |  |  |
| `--sidebar` | `#1b1a1a` |  |  |  |  |
| `--panel` | `#121a2d` |  |  |  |  |
| `--panel-border` | `#1e2740` |  |  |  |  |
| `--primary` | `#6366f1` |  |  |  |  |
| `--secondary` | `#818cf8` |  |  |  |  |
| `--text` | `#f8fafc` |  |  |  |  |
| `--muted` | `#94a3b8` |  |  |  |  |
| `--notebook` | `#fafaf8` |  |  | `#f8fafd` | cor do papel da folha |
| `--notebook-lines` | `#d9dde5` |  |  | `#e1e6ee` | linhas da pauta |
| `--notebook-grid` | `#dde1e8` |  |  |  | quadriculado |
| `--danger` | `#f87171` |  |  |  |  |
| `--favorite` | `#fbbf24` |  |  |  |  |

## 2. BASE

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--font-ui` | `'Inter', -apple-system, BlinkMacSystemFont, sans-serif` |  |  |  |  |
| `--font-hand` | `'Caveat', cursive` |  |  |  |  |
| `--radius-sm` | `6px` |  |  |  |  |
| `--radius-md` | `10px` |  |  |  |  |
| `--radius-lg` | `16px` |  |  |  |  |
| `--touch-min` | `44px` |  |  |  |  |
| `--safe-top` | `env(safe-area-inset-top, 0px)` |  |  |  |  |
| `--safe-right` | `env(safe-area-inset-right, 0px)` |  |  |  |  |
| `--safe-bottom` | `env(safe-area-inset-bottom, 0px)` |  |  |  |  |
| `--safe-left` | `env(safe-area-inset-left, 0px)` |  |  |  |  |
| `--z-dock` | `30` |  |  |  | barra de ferramentas do desenho (doca) |
| `--z-panel` | `35` |  |  |  | painel de propriedades (celular) |
| `--z-topbar` | `50` |  |  |  |  |
| `--z-drawer-backdrop` | `55` |  |  |  |  |
| `--z-drawer` | `60` |  |  |  |  |
| `--z-modal` | `80` |  |  |  | janelas (renomear): acima da gaveta e da barra superior |
| `--ease` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |  |  |  |  |
| `--t-fast` | `0.15s` |  |  |  |  |
| `--t-drawer` | `0.24s` |  |  |  |  |
| `--main-drawer-width` | `280px` |  |  |  | largura do menu lateral esquerdo (gaveta) |

## 3. FOLHA E O ESPAÇO EM VOLTA

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--sheet-max-w` | `960px` |  |  |  | largura máxima da folha em telas grandes |
| `--sheet-aspect-ratio` | `3 / 4` |  |  | `auto` | proporção largura/altura da folha |
| `--sheet-radius` | `var(--radius-lg)` |  |  | `12px` | canto arredondado da folha |
| `--sheet-canvas-radius` | `var(--radius-sm)` |  |  |  | canto da área de escrita/desenho |
| `--sheet-shadow` | `0 20px 60px rgba(0, 0, 0, 0.35)` |  |  | `0 8px 28px rgba(0, 0, 0, 0.4)` | sombra da folha |
| `--sheet-content-pad-top` | `clamp(18px, 2.6vw, 28px)` |  |  | `6px` | margem interna superior |
| `--sheet-content-pad-x` | `clamp(16px, 3.4vw, 40px)` |  |  | `8px` | margens internas laterais |
| `--sheet-content-pad-bottom` | `clamp(20px, 3vw, 40px)` |  |  | `8px` | margem interna inferior |
| `--sheet-side-col-w` | `210px` |  |  |  | largura das 2 colunas laterais (>= 1280px); mantenha iguais |
| `--layout-page-pad-top` | `46px` |  |  | `14px` | respiro externo acima da folha |
| `--layout-page-pad-x` | `24px` |  |  |  | respiro externo lateral (base de esquerda/direita) |
| `--layout-page-pad-left` | `var(--layout-page-pad-x)` |  |  | `10px` | respiro à esquerda da folha |
| `--layout-page-pad-right` | `var(--layout-page-pad-x)` |  |  | `4px` | respiro à direita (antes das divisórias) |
| `--layout-page-pad-bottom` | `40px` | `calc(16px + var(--mobile-toolbar-h, 0px))` |  | `calc(4px + var(--mobile-toolbar-h, 0px))` | respiro externo abaixo da folha |
| `--tabs-gutter` | `40px` |  | `0px` | `0px` | folga à direita onde ficam as divisórias (0 quando há 3 colunas) |
| `--sheet-fav-top` | `12px` |  |  | `6px` | distância do topo da folha |
| `--sheet-fav-left` | `20px` |  |  | `8px` | distância da esquerda da folha |
| `--sheet-fav-size` | `18px` |  |  | `21px` | tamanho da estrela |
| `--sheet-fav-hit` | `0px` |  |  | `44px` | área mínima de toque da estrela (44px no celular) |
| `--sheet-status-size` | `12px` |  |  |  | tamanho do texto "Salvo" |

## 4. FICHÁRIO › MATÉRIAS (divisórias coloridas)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--subject-tabs-w` | `34px` |  |  | `40px` | largura da coluna de divisórias |
| `--subject-tabs-gap` | `4px` |  |  | `6px` | distância entre divisórias |
| `--subject-tab-w` | `28px` |  |  | `34px` | largura da divisória (repouso) |
| `--subject-tab-w-hover` | `32px` |  |  | `34px` | largura ao passar o mouse |
| `--subject-tab-w-active` | `36px` |  |  | `34px` | largura da matéria aberta |
| `--subject-tab-h` | `92px` |  |  | `auto` | altura da divisória (auto no celular) |
| `--subject-tab-h-short` | `72px` |  |  |  | altura em janelas baixas (<= 760px de altura) |
| `--subject-tab-min-h` | `auto` |  |  | `54px` | altura mínima (celular: 54px) |
| `--subject-tab-max-h` | `none` |  |  | `128px` | altura máxima (celular) |
| `--subject-tab-pad-y` | `8px` |  |  | `10px` | espaço vertical interno |
| `--subject-tab-pad-start` | `6px` |  |  | `0px` | espaço do lado "enfiado" sob a folha |
| `--subject-tab-overlap` | `-6px` |  |  | `2px` | quanto a divisória entra por baixo da folha |
| `--subject-tab-radius` | `0 9px 9px 0` |  |  | `13px` | formato dos cantos |
| `--subject-tab-shadow` | `inset -2px 0 0 rgba(0, 0, 0, 0.16), 2px 2px 6px rgba(0, 0, 0, 0.28)` |  |  | `0 4px 12px rgba(0, 0, 0, 0.3)` | sombra (repouso) |
| `--subject-tab-shadow-active` | `inset -2px 0 0 rgba(255, 255, 255, 0.35), 3px 3px 10px rgba(0, 0, 0, 0.38)` |  |  | `0 4px 12px rgba(0, 0, 0, 0.3)` | sombra da aberta |
| `--subject-tab-font-size` | `12px` |  |  | `12.5px` | tamanho do nome da matéria |
| `--subject-tab-label-max-h` | `100%` |  |  | `104px` | comprimento máximo do nome (corta com …) |
| `--subject-tabs-bleed` | `8px` |  |  | `0px` | folga p/ a aba ativa sair da coluna (0 no celular) |

## 5. FICHÁRIO › ATALHOS (Início, Todas as páginas, Favoritos)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--shortcut-h` | `30px` |  |  | `var(--touch-min)` | altura do ícone de atalho |
| `--shortcut-icon-size` | `15px` |  |  | `18px` | tamanho do desenho do ícone |
| `--shortcut-group-gap` | `8px` |  |  | `6px` | distância entre os atalhos e as matérias |
| `--shortcut-bg` | `#2a3452` |  |  | `var(--chip-bg)` | fundo (repouso) |
| `--shortcut-fg` | `#cdd6f4` |  |  | `var(--chip-fg)` | cor do ícone (repouso) |
| `--shortcut-active-bg` | `var(--primary)` |  |  | `linear-gradient(160deg, #2a62ff, #3b57ff)` | fundo do atalho aberto |
| `--shortcut-border-w` | `0px` |  |  | `1px` | contorno do atalho (celular: 1px) |
| `--shortcut-border-color` | `transparent` |  |  | `var(--chip-border)` |  |
| `--shortcut-active-shadow` | `var(--subject-tab-shadow-active)` |  |  | `0 6px 16px rgba(47, 107, 255, 0.45)` |  |
| `--shortcut-active-fg` | `#fff` |  |  |  |  |

## 6. FICHÁRIO › TÓPICOS (abas acima da folha)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--topic-strip-inset` | `22px` |  |  |  | recuo lateral da faixa de abas |
| `--topic-tab-height` | `28px` |  |  | `var(--touch-min)` | altura da aba normal |
| `--topic-tab-active-height` | `22px` |  |  | `var(--touch-min)` | altura da aba ativa |
| `--topic-tab-max-w` | `190px` |  |  | `170px` | largura máxima de cada aba |
| `--topic-tab-pad-x` | `16px` |  |  | `18px` | espaço horizontal dentro das abas |
| `--topic-tab-pad-top` | `0px` |  |  | `8px` | espaço acima do texto (celular: 8px) |
| `--topic-tab-font-size` | `12.5px` |  |  |  | tamanho do texto das abas |
| `--topic-tab-radius` | `10px` |  |  |  | canto superior das abas |
| `--topic-tab-bar` | `3px` |  |  |  | faixa colorida no topo da aba ativa |
| `--topic-tab-gap` | `3px` |  |  | `0px` | distância entre abas |
| `--topic-tabs-pad-top` | `4px` |  |  | `0px` | folga acima da faixa (realce da ativa) |
| `--topic-tabs-max-w` | `62%` |  |  | `70%` | largura máxima do conjunto de abas |
| `--topic-tab-body-inset` | `2px` |  |  |  | celular: recuo lateral do corpo colorido |
| `--topic-tab-body-top` | `12px` |  |  |  | celular: início do corpo colorido (aba normal) |
| `--topic-tab-body-top-active` | `7px` |  |  |  | celular: início do corpo da aba ativa |

## 7. FICHÁRIO › NOME DA PÁGINA (só no computador)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--page-title-flex-basis` | `140px` |  |  |  | largura inicial do campo de título |
| `--page-title-max-w` | `350px` |  |  |  | largura máxima do campo de título |
| `--page-title-height` | `22px` |  |  |  | altura do campo de título |
| `--page-title-font-size` | `13px` |  |  |  | tamanho do texto do título |
| `--page-title-icon-size` | `14px` |  |  |  | tamanho do ícone ao lado do título |
| `--page-title-gap` | `8px` |  |  |  | distância entre ícone e texto |
| `--page-title-pad-x` | `4px` |  |  |  | espaço lateral interno |
| `--page-title-after-tabs` | `14px` |  |  |  | distância entre a última aba e o título |
| `--sheet-appearance-trigger-size` | `34px` |  |  | `var(--touch-min)` | tamanho do botão Editar folha |
| `--sheet-appearance-panel-width` | `320px` |  |  |  | largura máxima da caixa |
| `--sheet-appearance-panel-padding` | `14px` |  |  |  | respiro interno da caixa |
| `--sheet-appearance-group-gap` | `12px` |  |  |  | distância entre grupos de opções |
| `--sheet-appearance-options-gap` | `6px` |  |  |  | distância entre opções |
| `--sheet-appearance-option-height` | `40px` |  |  | `var(--touch-min)` | altura das opções |
| `--sheet-appearance-title-size` | `14px` |  |  |  | título da caixa |
| `--sheet-appearance-label-size` | `11px` |  |  |  | rótulos dos grupos |
| `--sheet-appearance-option-size` | `12px` |  |  |  | texto das opções |

## 8. CABEÇALHO DA FOLHA (Matéria · Tópico · Data)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--page-header-label-size` | `10px` |  |  |  | rótulos MATÉRIA/TÓPICO/DATA |
| `--page-header-value-size` | `clamp(16px, 2vw, 20px)` |  |  |  | valores do cabeçalho |
| `--page-header-value-size-container` | `clamp(15px, 2.8cqi, 18px)` |  |  |  | acompanha a largura da folha |
| `--page-header-edit-size` | `15px` |  |  |  | largura/altura do lápis de edição |
| `--page-header-edit-icon-size` | `11px` |  |  |  | tamanho do desenho do lápis |
| `--page-header-touch-edit-size` | `28px` |  |  |  | lápis em telas sem mouse (qualquer largura) |
| `--page-header-touch-edit-icon-size` | `13px` |  |  |  |  |
| `--page-header-mobile-min-h` | `30px` |  |  |  | celular: altura mínima da linha do tópico |
| `--page-header-mobile-gap` | `8px` |  |  |  | celular: distância entre rótulo e valor |
| `--page-header-mobile-pad-left` | `30px` |  |  |  | celular: espaço da estrela |
| `--page-header-mobile-pad-right` | `44px` |  |  |  | celular: espaço do menu ⋯ |
| `--page-header-mobile-label-size` | `15px` |  |  |  | celular: "Tópico:" |
| `--page-header-mobile-value-size` | `24px` |  |  |  | celular: nome do tópico |
| `--page-header-mobile-edit-size` | `30px` |  |  |  | celular: lápis |
| `--page-header-mobile-edit-icon-size` | `15px` |  |  |  |  |
| `--page-menu-btn-w` | `var(--touch-min)` |  |  |  | celular: botão ⋯ da folha |
| `--page-menu-btn-h` | `44px` |  |  |  |  |
| `--page-menu-btn-size` | `22px` |  |  |  |  |

## 9. BARRA SUPERIOR

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--topbar-h` | `45px` |  |  | `50px` | altura da barra superior |
| `--topbar-gap` | `12px` |  |  | `4px` | distância geral entre grupos |
| `--topbar-padding-x` | `14px` |  |  | `6px` | margem interna à esquerda |
| `--topbar-padding-end` | `var(--topbar-padding-x)` |  |  | `10px` | margem interna à direita |
| `--topbar-side-gap` | `12px` |  |  | `6px` | distância entre itens (lado esquerdo) |
| `--topbar-right-gap` | `var(--topbar-side-gap)` |  |  | `0px` | distância entre itens (lado direito) |
| `--topbar-menu-btn-size` | `34px` |  |  | `40px` | botão do menu ☰ |
| `--topbar-menu-icon-size` | `21px` |  |  | `26px` |  |
| `--topbar-btn-size` | `34px` |  |  | `var(--touch-min)` | botões de tema e modo escrita |
| `--topbar-btn-radius` | `var(--radius-sm)` |  |  | `12px` |  |
| `--topbar-theme-icon-size` | `17px` |  |  | `21px` |  |
| `--topbar-focus-icon-size` | `19px` |  |  |  | modo escrita (só celular) |
| `--topbar-action-height` | `32px` |  |  | `var(--touch-min)` | botão "Salvar como" |
| `--topbar-action-w` | `auto` |  |  | `38px` | largura (celular: só ícone) |
| `--topbar-action-radius` | `8px` |  |  | `11px` |  |
| `--topbar-brand-size` | `14px` |  |  | `16px` | nome da marca |
| `--topbar-logo-size` | `26px` |  |  |  | logotipo do celular |
| `--topbar-mobile-title-gap` | `8px` |  |  |  |  |
| `--topbar-action-pad-x` | `12px` |  |  |  | espaço lateral interno do botão Salvar como |
| `--topbar-action-gap` | `8px` |  |  |  | distância entre ícone e texto do botão Salvar como |
| `--topbar-action-font-size` | `13px` |  |  |  | tamanho do texto do botão Salvar como |
| `--topbar-text-size` | `13px` |  |  |  | tamanho do caminho/navegação da topbar |
| `--topbar-title-gap` | `8px` |  |  |  | distância entre itens do breadcrumb e marca |
| `--topbar-title-icon-size` | `22px` |  |  |  | tamanho do ícone da marca |
| `--topbar-title-subtitle-size` | `11px` |  |  |  | tamanho do subtítulo da marca |
| `--topbar-icon-size` | `15px` |  |  |  | tamanho dos ícones de navegação |
| `--topbar-separator-size` | `11px` |  |  |  | tamanho do separador do breadcrumb |
| `--topbar-export-menu-width` | `260px` |  |  |  | largura mínima do menu Salvar como |
| `--topbar-export-menu-padding` | `6px` |  |  |  | espaço interno do menu Salvar como |
| `--topbar-export-item-gap` | `14px` |  |  |  | distância entre ícone e texto dos itens de exportação |
| `--topbar-export-item-pad-y` | `10px` |  |  |  | espaço vertical dos itens de exportação |
| `--topbar-export-item-pad-x` | `12px` |  |  |  | espaço horizontal dos itens de exportação |
| `--topbar-export-icon-size` | `22px` |  |  |  | tamanho dos ícones de exportação |
| `--topbar-export-icon-width` | `26px` |  |  |  | coluna reservada aos ícones de exportação |
| `--topbar-export-title-size` | `14.5px` |  |  |  | tamanho do título de cada formato de exportação |
| `--topbar-export-subtitle-size` | `12.5px` |  |  |  | tamanho da descrição do formato de exportação |

## 10. MENU ESQUERDO (gaveta)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--sidebar-logo-icon-size` | `30px` |  |  |  | largura/altura do bloco do logotipo |
| `--sidebar-logo-title-size` | `16px` |  |  |  | tamanho da fonte do título do menu esquerdo |
| `--sidebar-logo-subtitle-size` | `0px` |  |  |  | tamanho do subtítulo do menu esquerdo |
| `--sidebar-nav-pad-top` | `14px` |  |  |  | margem superior da navegação do menu |
| `--sidebar-nav-pad-x` | `12px` |  |  |  | margens laterais da navegação do menu |
| `--sidebar-nav-gap` | `4px` |  |  |  | distância vertical entre itens do menu |
| `--sidebar-nav-item-gap` | `12px` |  |  |  | distância entre ícone e texto do item |
| `--sidebar-nav-item-pad-y` | `10px` |  |  | `10px` | espaço vertical interno dos itens do menu |
| `--sidebar-nav-item-pad-x` | `12px` |  |  |  | espaço horizontal interno dos itens do menu |
| `--sidebar-nav-font-size` | `11px` |  |  |  | tamanho dos rótulos de navegação |
| `--sidebar-nav-icon-size` | `13px` |  |  |  | tamanho dos ícones de navegação |
| `--sidebar-nav-icon-width` | `12px` |  |  |  | largura reservada aos ícones de navegação |
| `--sidebar-nav-badge-min-width` | `24px` |  |  |  | largura mínima dos contadores da navegação |
| `--sidebar-nav-badge-pad-y` | `1px` |  |  |  | espaço vertical interno dos contadores |
| `--sidebar-nav-badge-pad-x` | `8px` |  |  |  | espaço horizontal interno dos contadores |
| `--sidebar-section-top-gap` | `18px` |  |  |  | distância antes da seção Matérias |
| `--sidebar-section-pad-x` | `14px` |  |  |  | margem lateral da seção Matérias |
| `--sidebar-section-pad-top` | `14px` |  |  |  | margem superior da área de matérias |
| `--sidebar-section-min-height` | `120px` |  |  |  | altura mínima da lista de matérias |
| `--sidebar-logo-gap` | `12px` |  |  |  | distância entre logotipo e nome |
| `--sidebar-logo-pad-x-start` | `18px` |  |  |  | margem esquerda do cabeçalho do menu |
| `--sidebar-logo-pad-x-end` | `14px` |  |  |  | margem direita do cabeçalho do menu |
| `--sidebar-logo-icon-glyph-size` | `20px` |  |  |  | tamanho do símbolo dentro do logotipo |
| `--sidebar-section-title-gap` | `8px` |  |  |  | distância entre ícone e nome da seção |
| `--sidebar-section-header-pad-x` | `4px` |  |  |  | margem lateral do cabeçalho da seção |
| `--sidebar-add-button-font-size` | `13px` |  |  | `16px` | tamanho do símbolo adicionar matéria |
| `--sidebar-section-header-pad-bottom` | `10px` |  |  |  | espaço abaixo do cabeçalho da seção |
| `--sidebar-section-header-font-size` | `12px` |  |  |  | tamanho dos rótulos do menu lateral |
| `--sidebar-section-icon-size` | `14px` |  |  |  | tamanho do ícone da seção Matérias |
| `--sidebar-section-button-size` | `18px` |  |  | `var(--touch-min)` | largura/altura do botão de ação da seção |
| `--sidebar-new-subject-gap` | `6px` |  |  |  | distância entre campo e ações de nova matéria |
| `--sidebar-new-subject-pad-bottom` | `10px` |  |  |  | espaço abaixo do campo de nova matéria |

## 11. ÁRVORE DO MENU + BACKUP / RODAPÉ

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--tree-row-font-size` | `11px` |  |  |  | fonte dos nomes de matérias e tópicos |
| `--tree-page-font-size` | `11px` |  |  |  | fonte dos nomes e números das páginas |
| `--tree-row-icon-size` | `13px` |  |  |  | tamanho dos ícones de matéria e tópico |
| `--tree-page-icon-size` | `13px` |  |  |  | tamanho do ícone de página |
| `--tree-row-chevron-size` | `11px` |  |  |  | tamanho das setas de abrir/fechar |
| `--tree-row-count-size` | `12px` |  |  |  | fonte da quantidade de páginas do tópico |
| `--tree-page-favorite-size` | `12px` |  |  |  | tamanho do ícone de página favorita |
| `--tree-action-size` | `20px` |  |  |  | largura/altura dos botões de editar e excluir |
| `--tree-action-font-size` | `14px` |  |  |  | tamanho dos ícones dos botões da árvore |
| `--tree-edit-input-font-size` | `14px` |  |  |  | fonte ao renomear matéria, tópico ou página |
| `--tree-action-mobile-font-size` | `16px` |  |  |  | fonte dos botões da árvore no celular |
| `--tree-edit-mobile-input-font-size` | `16px` |  |  |  | fonte dos campos de edição no celular |
| `--tree-error-font-size` | `12px` |  |  |  | fonte da mensagem de erro ao renomear |
| `--tree-empty-font-size` | `13px` |  |  |  | fonte do aviso de tópico sem páginas |
| `--sidebar-backup-gap` | `6px` |  |  |  | distância entre controles do backup |
| `--sidebar-backup-pad-y` | `10px` |  |  |  | espaço vertical da área de backup |
| `--sidebar-backup-pad-x` | `14px` |  |  |  | espaço horizontal da área de backup |
| `--sidebar-backup-title-size` | `13px` |  |  |  | tamanho do título da área de backup |
| `--sidebar-backup-button-height` | `36px` |  |  | `var(--touch-min)` | altura dos botões de backup |
| `--sidebar-backup-button-pad-y` | `6px` |  |  |  | espaço vertical interno dos botões de backup |
| `--sidebar-backup-button-pad-x` | `10px` |  |  |  | espaço horizontal interno dos botões de backup |
| `--sidebar-backup-button-columns` | `repeat(2, minmax(0, 1fr))` |  |  |  | duas colunas lado a lado |
| `--sidebar-backup-note-size` | `0px` |  |  |  | tamanho da nota de privacidade do backup |
| `--sidebar-input-font-size` | `14px` |  |  |  | tamanho do texto do campo adicionar matéria |
| `--sidebar-input-pad-y` | `0px` |  |  | `10px` | espaço vertical dos campos do menu |
| `--sidebar-input-pad-x` | `10px` |  |  | `12px` | espaço horizontal dos campos do menu |
| `--sidebar-footer-padding-y` | `12px` |  |  |  | espaço vertical do rodapé do menu |
| `--sidebar-footer-padding-x` | `14px` |  |  |  | espaço horizontal do rodapé do menu |
| `--sidebar-footer-label-size` | `11px` |  |  |  | tamanho do rótulo do contador no rodapé |
| `--sidebar-footer-count-size` | `11px` |  |  |  | tamanho do número do contador no rodapé |
| `--sidebar-secondary-button-gap` | `12px` |  |  |  | distância entre ícone e texto dos botões inferiores |
| `--sidebar-secondary-button-padding-y` | `10px` |  |  |  | espaço vertical dos botões inferiores do menu |
| `--sidebar-secondary-button-padding-x` | `10px` |  |  |  | espaço horizontal dos botões inferiores do menu |
| `--sidebar-about-font-size` | `10px` |  |  |  | tamanho do texto Sobre e créditos |
| `--sidebar-install-width-inset` | `32px` |  |  |  | desconto lateral da largura do botão instalar |
| `--sidebar-install-margin-x` | `16px` |  |  |  | margem horizontal do botão instalar |
| `--sidebar-install-margin-bottom` | `12px` |  |  |  | margem inferior do botão instalar |
| `--sidebar-install-font-size` | `13.5px` |  |  |  | tamanho do texto do botão instalar |
| `--sidebar-install-icon-size` | `18px` |  |  |  | tamanho do ícone de instalar |
| `--sidebar-install-note-size` | `11.5px` |  |  |  | tamanho da descrição do botão instalar |
| `--sidebar-about-gap` | `10px` |  |  |  | distância entre ícone e texto de Sobre |
| `--sidebar-about-width-inset` | `32px` |  |  |  | desconto lateral da largura do botão Sobre |
| `--sidebar-about-margin-x` | `16px` |  |  |  | margem horizontal do botão Sobre |
| `--sidebar-about-margin-bottom` | `10px` |  |  |  | margem inferior do botão Sobre |
| `--sidebar-about-pad-x` | `12px` |  |  |  | espaço horizontal interno do botão Sobre |
| `--sidebar-about-icon-size` | `15px` |  |  |  | tamanho do ícone de Sobre |

## 12. CAIXA DE FERRAMENTAS DE TEXTO

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--rte-control-size` | `32px` |  |  | `var(--touch-min)` | largura/altura dos botões (celular: 44px) |
| `--rte-btn-pad-x` | `6px` |  |  |  | espaço lateral dentro do botão |
| `--rte-btn-gap` | `6px` |  |  |  | distância entre ícone e texto do botão |
| `--rte-btn-radius` | `8px` |  |  |  | canto dos botões |
| `--rte-btn-font-size` | `15px` |  |  |  | tamanho do ícone/letra dos botões |
| `--rte-done-font-size` | `13px` |  |  |  | texto do botão Concluir |
| `--rte-done-pad-x` | `12px` |  |  |  | espaço lateral do botão Concluir |
| `--rte-color-bar-w` | `18px` |  |  |  | barrinha de cor sob o "A" |
| `--rte-color-bar-h` | `4px` |  |  |  |  |
| `--rte-toolbar-max-width` | `720px` |  |  |  | largura máxima da barra flutuante |
| `--rte-toolbar-top-gap` | `8px` |  |  |  | distância da barra flutuante até a barra superior |
| `--rte-toolbar-gap` | `6px` |  |  |  | distância entre grupos da barra |
| `--rte-toolbar-padding` | `6px` |  |  |  | espaço interno da barra |
| `--rte-toolbar-radius` | `12px` |  |  |  | canto da barra flutuante |
| `--rte-toolbar-font-size` | `12px` |  |  |  | texto base da barra |
| `--rte-group-gap` | `2px` |  |  |  | distância entre botões de um grupo ("pílula") |
| `--rte-group-pad` | `2px` |  |  |  | espaço interno da pílula |
| `--rte-group-radius` | `9px` |  |  |  | canto da pílula |
| `--rte-field-gap` | `6px` |  |  |  | distância entre ícone/rótulo e contador |
| `--rte-field-icon-size` | `15px` |  |  |  | ícone ao lado do contador |
| `--rte-field-label-size` | `11px` |  |  |  | rótulo "Tamanho" / "Entre linhas" |
| `--rte-menu-pad` | `12px` |  |  |  | espaço interno dos menus de cor e marcadores |
| `--rte-menu-radius` | `12px` |  |  |  |  |
| `--rte-menu-title-size` | `11px` |  |  |  | título dentro dos menus |
| `--rte-auto-h` | `30px` |  |  |  | botão "Automático" |
| `--rte-auto-font-size` | `12px` |  |  |  |  |
| `--rte-palette-cols` | `13` |  |  |  | quantidade de cores por linha |
| `--rte-palette-gap` | `4px` |  |  |  | distância entre cores |
| `--rte-swatch-size` | `22px` |  |  |  | quadradinho de cor |
| `--rte-swatch-radius` | `5px` |  |  |  |  |
| `--rte-marker-gap` | `6px` |  |  |  | distância entre marcadores |
| `--rte-marker-h` | `40px` |  |  |  | altura de cada marcador |
| `--rte-marker-font-size` | `20px` |  |  |  | tamanho do símbolo do marcador |
| `--rte-marker-wide-font-size` | `12px` |  |  |  | marcadores numerados (1. 2. 3.) |
| `--rte-marker-bullet-w` | `44px` |  |  |  | largura de cada marcador de bolinha |
| `--rte-marker-number-w` | `84px` |  |  |  | largura de cada marcador numerado |
| `--rte-panel-width` | `200px` |  |  |  | largura do painel |
| `--rte-panel-padding` | `12px` |  |  |  | espaço interno do painel |
| `--rte-panel-gap` | `8px` |  |  |  | distância entre grupos |
| `--rte-panel-radius` | `8px` |  |  |  |  |
| `--rte-panel-font-size` | `12px` |  |  |  |  |
| `--rte-panel-title-size` | `13px` |  |  |  | título "Texto" |
| `--rte-docked-top` | `16px` |  |  |  | distância do painel até o topo ao rolar |
| `--rte-docked-max-height-gap` | `40px` |  |  |  | reserva vertical abaixo da barra superior |
| `--rte-docked-section-gap` | `4px` |  |  |  | distância entre controles de cada grupo |
| `--rte-docked-section-padding` | `6px` |  |  |  | espaço interno dos grupos |
| `--rte-docked-stepper-gap` | `8px` |  |  |  | distância entre Tamanho e Entre linhas |
| `--rte-docked-stepper-padding` | `8px` |  |  |  | espaço interno do grupo de contadores |
| `--rte-group-label-size` | `11px` |  |  |  | rótulo de cada grupo |
| `--rte-float-panel-top-gap` | `12px` |  |  |  | 901–1279px: distância do painel flutuante à barra superior |
| `--rte-float-panel-left-gap` | `12px` |  |  |  | 901–1279px: distância da borda esquerda |
| `--rte-dock-pad` | `8px` |  |  |  | espaço interno da doca |
| `--rte-dock-gap` | `6px` |  |  |  | distância entre grupos |
| `--rte-dock-done-pad-x` | `14px` |  |  |  | espaço lateral do botão Concluir na doca |
| `--rte-dock-radius` | `16px 16px 0 0` |  |  |  |  |
| `--rte-dock-sheet-max-h` | `min(42dvh, 360px)` |  |  |  | altura máx. da folha de cores/marcadores |
| `--rte-dock-swatch-size` | `34px` |  |  |  | quadradinho de cor na doca |
| `--rte-dock-marker-h` | `48px` |  |  |  | altura do marcador na doca |
| `--rte-stepper-height` | `34px` |  |  | `var(--touch-min)` | altura do contador |
| `--rte-stepper-button-width` | `34px` |  |  | `var(--touch-min)` | largura dos botões − e + |
| `--rte-stepper-button-font-size` | `18px` |  |  |  | tamanho do − e + |
| `--rte-stepper-input-width` | `46px` |  |  | `52px` | largura do número |
| `--rte-stepper-font-size` | `14px` |  |  | `16px` | tamanho do número |
| `--rte-stepper-radius` | `8px` |  |  |  |  |

## 13. CAIXA DE FERRAMENTAS DE FORMAS (painel de propriedades)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--ecp-panel-w` | `264px` |  |  |  | largura do painel flutuante (901–1279px) |
| `--ecp-panel-w-wide` | `176px` |  |  |  | largura da coluna ao lado da folha (>= 1280px) |
| `--ecp-panel-pad` | `12px` |  |  | `0 12px 14px` | espaço interno |
| `--ecp-panel-gap` | `12px` |  |  | `14px` | distância entre seções |
| `--ecp-panel-radius` | `8px 0 0 8px` |  |  | `14px` | canto do painel |
| `--ecp-panel-font-size` | `12px` |  |  |  | texto base |
| `--ecp-panel-top-gap` | `12px` |  |  |  | 901–1279px: distância até a barra superior |
| `--ecp-panel-side-gap` | `12px` |  |  |  | 901–1279px: distância da borda direita |
| `--ecp-panel-sticky-top` | `16px` |  |  |  | >= 1280px: distância ao topo ao rolar |
| `--ecp-label-size` | `12px` |  |  |  | título da seção ("Contorno", "Fundo"…) |
| `--ecp-sublabel-size` | `10.5px` |  |  |  | texto pequeno |
| `--ecp-row-gap` | `6px` |  |  | `8px` | distância entre botões de uma linha |
| `--ecp-btn-size` | `32px` |  |  | `var(--touch-min)` | botão de ícone (celular: 44px) |
| `--ecp-btn-font-size` | `13px` |  |  |  |  |
| `--ecp-btn-radius` | `8px` |  |  |  |  |
| `--ecp-swatch-size` | `24px` |  |  | `34px` | quadradinho de cor (celular: 34px) |
| `--ecp-swatch-lg-size` | `32px` |  |  | `var(--touch-min)` | quadrado de cor grande (celular: 44px) |
| `--ecp-slider-h` | `auto` |  |  | `28px` | altura do controle deslizante (celular: 28px) |
| `--ecp-fontlist-pad` | `7px 10px` |  |  | `12px` | espaço de cada fonte da lista |
| `--ecp-fontlist-font-size` | `14px` |  |  |  |  |
| `--ecp-edit-text-h` | `38px` |  |  |  | botão "Editar texto" |
| `--ecp-edit-text-font-size` | `13px` |  |  |  |  |
| `--ecp-popover-pad` | `12px` |  |  |  | janelinha de cores |
| `--ecp-hex-h` | `34px` |  |  |  | campo do código da cor |
| `--ecp-mobile-bottom-gap` | `8px` |  |  |  | celular: distância acima da doca |
| `--ecp-mobile-max-h` | `min(48dvh, 440px)` |  |  |  | celular: altura máxima da gaveta |

## 14. BARRA DE DESENHO (seleção, retângulo, losango, elipse, seta…)

| Token | Computador | Tablet (≤1179) | ≥1280 | Celular (≤900) | O que controla |
|---|---|---|---|---|---|
| `--draw-btn-size` | `26px` | `var(--touch-min)` |  | `38px` | botão de ferramenta (doca: 44px; celular: 38px) |
| `--draw-btn-radius` | `var(--radius-sm)` |  |  |  |  |
| `--draw-group-gap` | `2px` |  |  |  | distância entre botões |
| `--draw-group-pad` | `2px` |  |  |  | espaço interno da barra |
| `--draw-group-radius` | `var(--radius-md)` |  |  |  | canto da barra |
| `--draw-tool-active-size` | `26px` | `52px` |  | `44px` | botão da ferramenta em uso (doca: 52px; celular: 44px) |
| `--draw-tool-active-radius` | `var(--radius-sm)` | `16px` |  | `14px` |  |
| `--draw-tool-active-margin` | `0px` | `0 4px` |  | `0 3px` |  |
| `--draw-tool-active-bg` | `var(--primary)` | `linear-gradient(135deg, #2f6bff, var(--primary))` |  | `var(--accent-grad)` |  |
| `--draw-tool-active-shadow` | `none` | `0 6px 18px rgba(79, 70, 229, 0.45)` |  | `0 4px 14px rgba(47, 107, 255, 0.45)` |  |
| `--draw-side-w` | `96px` |  |  | `104px` | doca: largura das laterais fixas (desfazer/refazer) |
| `--draw-roulette-inset` | `122px` |  |  | `22px` | doca: folga da "roleta" = metade da largura − isto |
| `--draw-handle-h` | `24px` |  |  | `16px` | doca: altura da alça de recolher |
| `--draw-handle-w` | `36px` |  |  | `92px` | doca: largura do puxador |
| `--draw-menu-item-h` | `44px` |  |  |  | doca: altura de cada item do menu "mais" |
| `--draw-dock-row-h` | `50px` |  |  |  | celular: altura da cápsula |
| `--draw-dock-radius` | `25px` |  |  |  | celular: canto da cápsula |
| `--paper-line-gap` | `36px` |  |  | `30px` |  |
| `--paper-grid-size` | `28px` |  |  |  |  |
