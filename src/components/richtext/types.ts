/**
 * Texto com formatação (cores por palavra/letra, negrito, itálico,
 * sublinhado, marcadores, espaçamento).
 *
 * O Excalidraw só sabe guardar UM estilo por elemento de texto, então o texto
 * formatado é guardado como um GRUPO de elementos nativos (ver native.ts):
 *  - um retângulo invisível (a "caixa") guarda o conteúdo formatado (este
 *    modelo) em `customData.rich` e define o tamanho do bloco;
 *  - um elemento `text` nativo para cada trecho de mesma cor em cada linha,
 *    mais um para cada marcador (• 1. a)...), e uma linha fina para cada
 *    trecho sublinhado — todos marcados com `customData.richPart`;
 *  - NEGRITO: o texto nativo não tem peso de fonte, então o trecho é escrito
 *    duas vezes, com um deslocamento de menos de 1px (continua texto nativo);
 *  - ITÁLICO: o texto nativo não tem inclinação, então SÓ os trechos em itálico
 *    viram uma pequena imagem (PNG) dentro do grupo; o resto continua texto.
 * Como são elementos nativos, o grupo seleciona, move, redimensiona, trava,
 * exporta e é salvo como qualquer outro objeto. Textos antigos, que eram uma
 * única imagem (`image`), continuam abrindo normalmente e viram um grupo
 * nativo quando são editados.
 */

export type MarkerKind =
  | 'none'
  | 'dot'
  | 'circle'
  | 'square'
  | 'diamond'
  | 'arrow'
  | 'check'
  | 'star'
  | 'dash'
  | 'box'
  | 'num-dot'
  | 'num-paren'
  | 'alpha-lower'
  | 'alpha-upper'
  | 'roman-lower'
  | 'roman-upper';

export interface Run {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  /** Cor em hex. Ausente = cor padrão do bloco (`RichDoc.color`). */
  color?: string;
}

export interface Para {
  runs: Run[];
  marker: MarkerKind;
  /** Nível de recuo (0 a MAX_INDENT). */
  indent: number;
}

export type Align = 'left' | 'center' | 'right';

export interface RichDoc {
  paras: Para[];
  /** Id de fonte do Excalidraw (5 = Manuscrita, 6 = Normal, 8 = Código...). */
  fontFamily: number;
  fontSize: number;
  /** Multiplicador do espaço entre linhas (1 = colado, 1.25 = padrão...). */
  lineHeight: number;
  align: Align;
  /** Cor padrão do texto. */
  color: string;
  /** Largura máxima do bloco, em unidades da folha. */
  width: number;
  /** Só para o layout (nunca é gravado): mede tudo sem negrito/itálico, porque o desenho é feito de outro jeito (ver native.ts). */
  plain?: boolean;
  /** false: o bloco encolhe até o texto (como o texto nativo). true: largura fixa, escolhida ao redimensionar. */
  fixedWidth: boolean;
}

/** O que foi usado no último desenho — serve para saber quando refazer o layout. */
export interface RichLayoutInfo {
  w: number;
  h: number;
  /** Só para texto dentro de forma: tamanho da forma no momento do layout. */
  cw?: number;
  ch?: number;
}

export interface RichCustomData {
  rich: RichDoc;
  lay: RichLayoutInfo;
  /** Texto dentro de uma forma (agrupado com ela). */
  inShape?: boolean;
}

export const MAX_INDENT = 4;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 200;
export const MIN_LINE_HEIGHT = 0.8;
export const MAX_LINE_HEIGHT = 3;
export const DEFAULT_WIDTH = 360;

export function defaultDoc(overrides: Partial<RichDoc> = {}): RichDoc {
  return {
    paras: [{ runs: [], marker: 'none', indent: 0 }],
    fontFamily: 5,
    fontSize: 20,
    lineHeight: 1.25,
    align: 'left',
    color: '#1e1e1e',
    width: DEFAULT_WIDTH,
    fixedWidth: false,
    ...overrides,
  };
}

export function docIsEmpty(doc: RichDoc): boolean {
  return doc.paras.every((p) => p.runs.every((r) => r.text.trim() === ''));
}

/** Converte texto simples (com \n) em parágrafos. */
export function parasFromPlainText(text: string): Para[] {
  const lines = (text || '').split('\n');
  return lines.map((line) => ({
    runs: line ? [{ text: line }] : [],
    marker: 'none' as const,
    indent: 0,
  }));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
