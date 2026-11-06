# Correção — redimensionamento da caixa de texto (sem esticar as palavras)

**Arquivo alterado:** `src/components/excalidraw/ExcalidrawLayer.tsx` (3 pontos)
**Validação:** `npx tsc --noEmit` → sem erros.

## O que estava errado

A caixa de texto formatado é um GRUPO do Excalidraw (retângulo invisível + várias
peças de texto). Ao arrastar qualquer alça, o Excalidraw escala o grupo inteiro,
incluindo o `fontSize` das peças — as palavras esticavam junto com a caixa.

O paliativo existente (esconder as peças durante o arrasto e reconstruir ao soltar)
tinha três falhas:

1. **Altura era descartada no rebuild.** Só a largura era capturada (`width: el.width`).
   Redimensionar só na vertical (alça de baixo) ou no canto (os dois eixos) perdia a
   altura escolhida — a caixa "voltava" para a altura natural do texto.
2. **Rebuild podia ser bloqueado** por uma falha anterior registrada em `richFailed`,
   deixando as peças com o tamanho esticado.
3. **Esconder-durante-arrasto não disparava** quando a seleção estava como grupo
   (`selectedElementIds` vazio, só `selectedGroupIds` preenchido) — e a opacidade
   original podia ser sobrescrita com 0 se o evento disparasse mais de uma vez.

## O que mudou

### 1. `rebuildRich` — captura largura E altura
Agora detecta `wChanged` e `hChanged` separadamente. Se a altura mudou, a caixa
reconstruída recebe `height = el.height` (a escolha do usuário) e `lay.h` é
atualizado. A fonte permanece a mesma — o espaço extra fica em branco no rodapé,
como num `<textarea>`.

### 2. `scheduleRichCheck` — limpa falhas anteriores antes de rebuildar
Em resize, entradas de `richFailed` da mesma caixa são removidas, garantindo que o
rebuild rode e as peças esticadas sejam substituídas por peças no tamanho original.

### 3. Esconder peças durante o arrasto — robusto
- Remove a guarda `richResizeHiddenRef.current.size === 0` (reafirma `opacity: 0`
  a cada evento durante o arrasto).
- Detecta o holder também por `selectedGroupIds` (seleção por grupo).
- Guarda a opacidade original só na primeira vez (`if (!has(p.id))`), para não
  sobrescrevê-la com 0 nas reafirmações.

## Revisão (tela preta ao redimensionar)

Na primeira versão desta correção a trava `richResizeHiddenRef.current.size === 0`
foi removida da rotina de esconder as peças. Sem ela, o `updateScene` que aplica
`opacity: 0` dispara um novo `onChange` a cada movimento do mouse, gerando um loop
infinito que trava a tela (fica preta). **A trava foi restaurada** — esconder as
peças uma única vez, no primeiro evento do arrasto, já basta. A melhoria da
detecção por `selectedGroupIds` foi mantida.

## Como testar

```bash
npm install   # se ainda não rodou
npm run dev
```

1. Ferramenta **Texto** (a caixa de texto formatado — não o "T" nativo) → crie uma caixa.
2. Selecione-a → aparecem as 8 alças do Excalidraw.
3. **Alça do meio da borda direita** → só a largura muda.
4. **Alça do meio da borda inferior** → só a altura muda.
5. **Cantos** → os dois eixos ao mesmo tempo.
6. Em todos os casos, o tamanho da fonte permanece igual.

> Observação: a ferramenta "T" nativa do Excalidraw SEMPRE escala a fonte ao
> redimensionar (comportamento padrão da biblioteca). Use a ferramenta **Texto**
> (richtext) para ter caixas com largura/altura independentes da fonte.
