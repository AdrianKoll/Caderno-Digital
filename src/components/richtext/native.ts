import { generateId } from '../../utils/id';
import { FONT_CSS, SYMBOL_STACK, boldOffset, ensureFontReady, layoutDoc, measureWidth, renderItalicRun } from './render';
import { RichCustomData, RichDoc } from './types';

type El = any;

/**
 * Construção do texto formatado como elementos NATIVOS do Excalidraw.
 *
 * O layout (quebra de linha, recuo, marcadores, alinhamento) vem do mesmo
 * `layoutDoc` de antes; aqui cada trecho já posicionado vira um elemento
 * `text` com a cor do trecho. Como todos os trechos de uma linha usam a mesma
 * fonte, tamanho e altura de linha, as linhas de base ficam alinhadas.
 *
 * Negrito e itálico não existem no texto nativo do Excalidraw:
 *  - negrito: o trecho é escrito duas vezes, com `boldOffset` de diferença;
 *  - itálico: só esse trecho vira uma pequena imagem (PNG) dentro do grupo.
 */

/**
 * Fundo da caixa: branco com 1/255 de opacidade. Fica invisível, mas o
 * Excalidraw só deixa clicar/arrastar dentro de uma forma quando o fundo não é
 * "transparent" — assim a caixa inteira é clicável, não só as letras.
 */
export const BOX_FILL = '#ffffff01';

export interface NativeBuild {
  /** Retângulo invisível que guarda o conteúdo (`customData.rich`) e o tamanho do bloco. */
  box: El;
  /** Textos (trechos e marcadores) e linhas de sublinhado, na ordem de desenho. */
  parts: El[];
  groupIds: string[];
  width: number;
  height: number;
  customData: RichCustomData;
  /** Imagens dos trechos em itálico (para `api.addFiles`). */
  files: { id: string; dataURL: string; mimeType: 'image/png'; created: number; lastRetrieved: number }[];
}

export interface NativeOptions {
  /** Largura total do bloco (com respiro). */
  maxWidth: number;
  /** O bloco encolhe até a linha mais larga. */
  hug: boolean;
  /** Dado o tamanho final do bloco, diz onde ele fica (canto superior esquerdo). */
  place: (w: number, h: number) => { x: number; y: number };
  /** Grupo do texto (e, se for texto dentro de forma, os grupos da forma). */
  groupIds: string[];
  /** Forma que contém o texto, se houver (guardamos o tamanho dela para saber quando refazer o layout). */
  container?: { width: number; height: number } | null;
  opacity?: number;
}

function baseElement(type: string, o: { x: number; y: number; width: number; height: number; groupIds: string[]; opacity: number }): El {
  return {
    id: generateId(),
    type,
    x: o.x,
    y: o.y,
    width: o.width,
    height: o.height,
    angle: 0,
    strokeColor: 'transparent',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 1,
    strokeStyle: 'solid',
    roughness: 0,
    opacity: o.opacity,
    groupIds: o.groupIds,
    frameId: null,
    roundness: null,
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    isDeleted: false,
    boundElements: null,
    updated: Date.now(),
    link: null,
    locked: false,
  };
}

/** Elemento `text` nativo, montado à mão com os campos que o Excalidraw grava (mesma abordagem de createLegacyTextElement). */
function textPart(o: {
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
  doc: RichDoc;
  groupIds: string[];
  opacity: number;
}): El {
  return {
    ...baseElement('text', o),
    strokeColor: o.color,
    text: o.text,
    originalText: o.text,
    fontSize: o.doc.fontSize,
    fontFamily: o.doc.fontFamily,
    lineHeight: o.doc.lineHeight,
    textAlign: 'left',
    verticalAlign: 'top',
    baseline: o.doc.fontSize,
    containerId: null,
    autoResize: true,
    customData: { richPart: true },
  };
}

/** Imagem de um trecho em itálico. */
function imagePart(o: { x: number; y: number; width: number; height: number; fileId: string; groupIds: string[]; opacity: number }): El {
  return {
    ...baseElement('image', o),
    status: 'saved',
    fileId: o.fileId,
    scale: [1, 1],
    crop: null,
    customData: { richPart: true },
  };
}

/** Sublinhado: um retângulo fino e cheio, na cor do trecho. */
function underlinePart(o: { x: number; y: number; width: number; height: number; color: string; groupIds: string[]; opacity: number }): El {
  return {
    ...baseElement('rectangle', o),
    backgroundColor: o.color,
    customData: { richPart: true },
  };
}

export async function buildNative(docIn: RichDoc, opts: NativeOptions): Promise<NativeBuild> {
  const doc: RichDoc = { ...docIn, plain: undefined, width: opts.maxWidth };
  await ensureFontReady(doc);
  // O layout mede tudo com a fonte normal: o negrito é o mesmo texto escrito duas vezes e o itálico só inclina.
  const layout = layoutDoc({ ...doc, plain: true }, opts.maxWidth, opts.hug);
  const origin = opts.place(layout.width, layout.height);
  const opacity = opts.opacity ?? 100;
  const groupIds = opts.groupIds;
  const lineH = layout.lineHeightPx;

  const parts: El[] = [];
  const files: NativeBuild['files'] = [];
  const bold = boldOffset(doc.fontSize);
  const markerFont = `400 ${doc.fontSize}px ${FONT_CSS[doc.fontFamily] ?? 'Excalifont'}, ${SYMBOL_STACK}`;

  for (const line of layout.lines) {
    const top = origin.y + line.y;

    if (line.marker) {
      const m = line.marker;
      const mw = measureWidth(markerFont, m.text);
      const dx = m.bold && m.numbered ? [0, bold] : [0];
      for (const d of dx) {
        parts.push(
          textPart({ x: origin.x + m.x + d, y: top, width: mw, height: lineH, text: m.text, color: m.color, doc, groupIds, opacity }),
        );
      }
    }

    for (const run of line.runs) {
      const color = run.color ?? doc.color;
      // Trecho só de espaços não precisa de elemento (o sublinhado, se houver, é desenhado abaixo).
      if (run.text.trim() !== '') {
        if (run.italic) {
          const img = renderItalicRun(doc, run.text, run.w, color, !!run.bold, lineH, layout.baseline);
          const fileId = `rich-${generateId()}`;
          files.push({ id: fileId, dataURL: img.dataURL, mimeType: 'image/png', created: Date.now(), lastRetrieved: Date.now() });
          parts.push(
            imagePart({ x: origin.x + run.x - img.padLeft, y: top, width: img.width, height: img.height, fileId, groupIds, opacity }),
          );
        } else {
          for (const d of run.bold ? [0, bold] : [0]) {
            parts.push(
              textPart({ x: origin.x + run.x + d, y: top, width: run.w, height: lineH, text: run.text, color, doc, groupIds, opacity }),
            );
          }
        }
      }
      if (run.underline) {
        parts.push(
          underlinePart({
            x: origin.x + run.x,
            y: top + layout.baseline + doc.fontSize * 0.12,
            width: run.w,
            height: Math.max(1, doc.fontSize / 16),
            color,
            groupIds,
            opacity,
          }),
        );
      }
    }
  }

  const customData: RichCustomData = {
    rich: { ...doc, plain: undefined },
    lay: { w: layout.width, h: layout.height, cw: opts.container?.width, ch: opts.container?.height },
    inShape: !!opts.container,
  };

  const box = {
    ...baseElement('rectangle', {
      x: origin.x,
      y: origin.y,
      width: layout.width,
      height: layout.height,
      groupIds,
      opacity,
    }),
    backgroundColor: BOX_FILL,
    customData,
  };

  return { box, parts, groupIds, width: layout.width, height: layout.height, customData, files };
}
