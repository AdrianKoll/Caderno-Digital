import { markerLabels, isNumbered } from './markers';
import { RichDoc, Run } from './types';

/**
 * Layout do texto formatado (e o desenho dos trechos em itálico num <canvas>).
 *
 * O editor (RichTextEditor.tsx) usa as MESMAS medidas — recuo, coluna do
 * marcador, altura de linha e posição da linha de base — para o que aparece
 * ao editar ser igual ao que fica na folha.
 */

export const PAD = 4; // respiro interno (unidades da folha), evita cortar "sobras" das letras
export const INDENT_UNIT = 1.6; // × tamanho da fonte, por nível de recuo
export const MARKER_COL = 1.5; // × tamanho da fonte, largura da coluna do marcador
export const RENDER_SCALE = 3; // nitidez do PNG (o zoom do Excalidraw ainda fica nítido até ~3x)
const MAX_CANVAS = 4096;

export const FONT_CSS: Record<number, string> = {
  1: 'Virgil',
  2: 'Helvetica',
  3: 'Cascadia',
  5: 'Excalifont',
  6: 'Nunito',
  7: '"Lilita One"',
  8: '"Comic Shanns"',
  9: '"Liberation Sans"',
  10: 'Assistant',
};

export const SYMBOL_STACK = '"Segoe UI Symbol","Noto Sans Symbols2","Noto Sans Symbols","Apple Symbols",Arial,sans-serif';

export function familyCss(fontFamily: number): string {
  return `${FONT_CSS[fontFamily] ?? 'Excalifont'}, sans-serif`;
}

export function fontString(doc: RichDoc, run: Pick<Run, 'bold' | 'italic'>): string {
  if (doc.plain) return `400 ${doc.fontSize}px ${familyCss(doc.fontFamily)}`;
  return `${run.italic ? 'italic ' : ''}${run.bold ? '700 ' : '400 '}${doc.fontSize}px ${familyCss(doc.fontFamily)}`;
}

/** Deslocamento do "negrito" (o trecho é escrito duas vezes, a esta distância). */
export function boldOffset(fontSize: number): number {
  return Math.max(0.6, fontSize * 0.04);
}

let scratch: CanvasRenderingContext2D | null = null;
function scratchCtx(): CanvasRenderingContext2D {
  if (!scratch) scratch = document.createElement('canvas').getContext('2d')!;
  return scratch;
}

/** Largura de um texto numa fonte CSS completa (ex.: `20px Excalifont, sans-serif`). */
export function measureWidth(font: string, text: string): number {
  const ctx = scratchCtx();
  ctx.font = font;
  return ctx.measureText(text).width;
}

/** Espera a fonte carregar (senão a medida sairia com a fonte reserva). */
export async function ensureFontReady(doc: RichDoc): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load(`400 ${doc.fontSize}px ${familyCss(doc.fontFamily)}`, 'Aa'),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    /* segue com a medida possível */
  }
}

export interface LaidRun extends Run {
  x: number;
  w: number;
}

export interface LaidLine {
  runs: LaidRun[];
  /** Topo da linha. */
  y: number;
  marker: { text: string; x: number; color: string; numbered: boolean; bold: boolean } | null;
}

export interface Layout {
  width: number;
  height: number;
  lines: LaidLine[];
  lineHeightPx: number;
  /** Distância do topo da linha até a linha de base. */
  baseline: number;
}

interface Token {
  text: string;
  run: Run;
  space: boolean;
  w: number;
}

function tokenize(doc: RichDoc, runs: Run[], ctx: CanvasRenderingContext2D): Token[] {
  const tokens: Token[] = [];
  for (const run of runs) {
    ctx.font = fontString(doc, run);
    for (const part of run.text.split(/(\s+)/)) {
      if (!part) continue;
      tokens.push({ text: part, run, space: /^\s+$/.test(part), w: ctx.measureText(part).width });
    }
  }
  return tokens;
}

function sameStyle(a: Run, b: Run): boolean {
  return !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.underline === !!b.underline && a.color === b.color;
}

/** Quebra um parágrafo em linhas de no máximo `maxW`. */
function wrapPara(doc: RichDoc, runs: Run[], maxW: number, ctx: CanvasRenderingContext2D): { runs: Run[]; w: number }[] {
  const tokens = tokenize(doc, runs, ctx);
  const lines: { tokens: Token[]; w: number }[] = [{ tokens: [], w: 0 }];
  const cur = () => lines[lines.length - 1];

  const push = (t: Token) => {
    cur().tokens.push(t);
    cur().w += t.w;
  };
  const newLine = () => lines.push({ tokens: [], w: 0 });

  for (const t of tokens) {
    if (t.space) {
      // Espaço no início de uma linha quebrada não é desenhado.
      if (cur().tokens.length === 0 && lines.length > 1) continue;
      push(t);
      continue;
    }
    if (cur().w + t.w <= maxW || cur().tokens.every((x) => x.space)) {
      // Palavra maior que a linha inteira: quebra por caractere.
      if (t.w > maxW) {
        let piece = '';
        ctx.font = fontString(doc, t.run);
        for (const ch of Array.from(t.text)) {
          const trial = piece + ch;
          if (piece && ctx.measureText(trial).width > maxW - cur().w) {
            push({ text: piece, run: t.run, space: false, w: ctx.measureText(piece).width });
            newLine();
            piece = ch;
          } else {
            piece = trial;
          }
        }
        if (piece) push({ text: piece, run: t.run, space: false, w: ctx.measureText(piece).width });
      } else {
        push(t);
      }
      continue;
    }
    // Não cabe: fecha a linha (sem o espaço do final) e começa outra.
    while (cur().tokens.length && cur().tokens[cur().tokens.length - 1].space) {
      cur().w -= cur().tokens.pop()!.w;
    }
    newLine();
    if (t.w > maxW) {
      let piece = '';
      ctx.font = fontString(doc, t.run);
      for (const ch of Array.from(t.text)) {
        const trial = piece + ch;
        if (piece && ctx.measureText(trial).width > maxW) {
          push({ text: piece, run: t.run, space: false, w: ctx.measureText(piece).width });
          newLine();
          piece = ch;
        } else {
          piece = trial;
        }
      }
      if (piece) push({ text: piece, run: t.run, space: false, w: ctx.measureText(piece).width });
    } else {
      push(t);
    }
  }

  // Tira o espaço pendurado no fim de cada linha e junta pedaços de mesmo estilo.
  return lines.map((line) => {
    const toks = [...line.tokens];
    while (toks.length && toks[toks.length - 1].space) toks.pop();
    const merged: Run[] = [];
    for (const t of toks) {
      const last = merged[merged.length - 1];
      if (last && sameStyle(last, t.run)) last.text += t.text;
      else merged.push({ ...t.run, text: t.text });
    }
    let w = 0;
    for (const r of merged) {
      ctx.font = fontString(doc, r);
      w += ctx.measureText(r.text).width;
    }
    return { runs: merged, w };
  });
}

export function lineMetrics(doc: RichDoc, ctx: CanvasRenderingContext2D) {
  ctx.font = fontString(doc, {});
  const m = ctx.measureText('Hg');
  const asc = (m as any).fontBoundingBoxAscent ?? doc.fontSize * 0.8;
  const desc = (m as any).fontBoundingBoxDescent ?? doc.fontSize * 0.25;
  const lineHeightPx = doc.fontSize * doc.lineHeight;
  // Igual ao CSS: o texto fica centralizado na caixa da linha (meio-espaçamento).
  const baseline = (lineHeightPx - (asc + desc)) / 2 + asc;
  return { lineHeightPx, baseline };
}

/**
 * Calcula o layout. `maxWidth` é a largura total do bloco (com respiro).
 * Com `hug` o bloco encolhe até a linha mais larga.
 */
export function layoutDoc(doc: RichDoc, maxWidth: number, hug: boolean, ctx: CanvasRenderingContext2D = scratchCtx()): Layout {
  const { lineHeightPx, baseline } = lineMetrics(doc, ctx);
  const contentMax = Math.max(doc.fontSize * 2, maxWidth - PAD * 2);
  const labels = markerLabels(doc.paras);

  interface Pre {
    runs: Run[];
    w: number;
    left: number;
    marker: string;
    para: number;
  }
  const pre: Pre[] = [];
  doc.paras.forEach((p, i) => {
    const left = p.indent * INDENT_UNIT * doc.fontSize + (p.marker !== 'none' ? MARKER_COL * doc.fontSize : 0);
    const wrapped = wrapPara(doc, p.runs, Math.max(doc.fontSize, contentMax - left), ctx);
    wrapped.forEach((l, k) => pre.push({ runs: l.runs, w: l.w, left, marker: k === 0 ? labels[i] : '', para: i }));
  });

  let width = maxWidth;
  if (hug) {
    const widest = Math.max(...pre.map((l) => l.left + l.w), 0);
    width = Math.min(maxWidth, Math.max(widest + PAD * 2, doc.fontSize * 1.5));
  }
  const avail = width - PAD * 2;

  const lines: LaidLine[] = pre.map((l, idx) => {
    const room = avail - l.left;
    const offset = doc.align === 'center' ? (room - l.w) / 2 : doc.align === 'right' ? room - l.w : 0;
    let x = PAD + l.left + Math.max(0, offset);
    const runs: LaidRun[] = l.runs.map((r) => {
      ctx.font = fontString(doc, r);
      const w = ctx.measureText(r.text).width;
      const laid = { ...r, x, w };
      x += w;
      return laid;
    });
    const para = doc.paras[l.para];
    const first = para.runs[0];
    return {
      runs,
      y: PAD + idx * lineHeightPx,
      marker: l.marker
        ? {
            text: l.marker,
            x: PAD + para.indent * INDENT_UNIT * doc.fontSize,
            color: first?.color ?? doc.color,
            numbered: isNumbered(para.marker),
            bold: !!first?.bold,
          }
        : null,
    };
  });

  return { width, height: PAD * 2 + Math.max(1, pre.length) * lineHeightPx, lines, lineHeightPx, baseline };
}

export interface RunImage {
  dataURL: string;
  /** Tamanho em unidades da folha (inclui as folgas da inclinação). */
  width: number;
  height: number;
  /** Folga à esquerda: o texto começa `padLeft` depois do início da imagem. */
  padLeft: number;
}

/**
 * Desenha UM trecho em itálico (com ou sem negrito) numa imagem do tamanho de
 * uma linha. É a única parte do texto formatado que não é texto nativo: o
 * Excalidraw não tem inclinação. Quando a fonte não tem uma face itálica, o
 * navegador inclina a normal.
 */
export function renderItalicRun(doc: RichDoc, text: string, w: number, color: string, bold: boolean, lineHeightPx: number, baseline: number): RunImage {
  const padLeft = doc.fontSize * 0.12;
  const padRight = doc.fontSize * 0.3; // a inclinação empurra o topo das letras para a direita
  const width = w + padLeft + padRight;
  const height = lineHeightPx;
  const canvas = document.createElement('canvas');
  const s = Math.max(0.5, Math.min(RENDER_SCALE, MAX_CANVAS / width, MAX_CANVAS / height));
  canvas.width = Math.max(1, Math.ceil(width * s));
  canvas.height = Math.max(1, Math.ceil(height * s));
  const ctx = canvas.getContext('2d')!;
  ctx.scale(s, s);
  ctx.textBaseline = 'alphabetic';
  ctx.font = `italic 400 ${doc.fontSize}px ${familyCss(doc.fontFamily)}`;
  ctx.fillStyle = color;
  ctx.fillText(text, padLeft, baseline);
  if (bold) {
    const d = boldOffset(doc.fontSize);
    ctx.fillText(text, padLeft + d / 2, baseline);
    ctx.fillText(text, padLeft + d, baseline);
  }
  return { dataURL: canvas.toDataURL('image/png'), width, height, padLeft };
}
