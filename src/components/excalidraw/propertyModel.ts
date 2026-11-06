/**
 * Modelo do painel de propriedades (a caixa de edição de objetos).
 *
 * Reproduz a lógica do painel do Excalidraw:
 *  - QUAIS seções aparecem depende do tipo do que está selecionado (ou da
 *    ferramenta ativa, quando nada está selecionado — aí o painel edita os
 *    valores padrão dos próximos elementos, como no Excalidraw);
 *  - o valor de cada seção é o valor comum da seleção, ou `null` quando os
 *    itens selecionados divergem (nenhum botão aparece marcado);
 *  - alterar uma propriedade muda os elementos selecionados E o padrão dos
 *    próximos (appState.currentItem*).
 *
 * Só usa dados públicos dos elementos e do appState do Excalidraw.
 */
import { generateId } from '../../utils/id';
import { isRichHolder, isRichPart, resolveEditTarget } from '../richtext/targets';

type El = any;

// ---------------------------------------------------------------------------
// Opções (mesmos valores do Excalidraw)
// ---------------------------------------------------------------------------

export const STROKE_WIDTHS = [
  { value: 1, label: 'Fino' },
  { value: 2, label: 'Grosso' },
  { value: 4, label: 'Extra grosso' },
];

export const ROUGHNESS = [
  { value: 0, label: 'Arquiteto' },
  { value: 1, label: 'Artista' },
  { value: 2, label: 'Cartunista' },
];

export const FILL_STYLES = [
  { value: 'hachure', label: 'Hachurado' },
  { value: 'cross-hatch', label: 'Hachurado cruzado' },
  { value: 'solid', label: 'Sólido' },
  { value: 'zigzag', label: 'Zigue-zague' },
];

export const STROKE_STYLES = [
  { value: 'solid', label: 'Sólida' },
  { value: 'dashed', label: 'Tracejada' },
  { value: 'dotted', label: 'Pontilhada' },
];

export const FONT_SIZES = [
  { value: 16, label: 'P', title: 'Pequeno' },
  { value: 20, label: 'M', title: 'Médio' },
  { value: 28, label: 'G', title: 'Grande' },
  { value: 36, label: 'GG', title: 'Muito grande' },
];

/** Fontes em destaque (as três primeiras do Excalidraw). */
export const FONT_PRIMARY = [
  { value: 5, title: 'Manuscrita', css: 'Excalifont' },
  { value: 6, title: 'Normal', css: 'Nunito' },
  { value: 8, title: 'Código', css: "'Comic Shanns'" },
];

/** Demais fontes, no menu "mais fontes". */
export const FONT_MORE = [
  { value: 1, title: 'Virgil', css: 'Virgil' },
  { value: 2, title: 'Helvetica', css: 'Helvetica' },
  { value: 3, title: 'Cascadia', css: 'Cascadia' },
  { value: 7, title: 'Lilita One', css: "'Lilita One'" },
];

const FONT_CSS: Record<number, string> = {
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

const LINE_HEIGHT: Record<number, number> = {
  1: 1.25,
  2: 1.15,
  3: 1.2,
  5: 1.25,
  6: 1.35,
  7: 1.15,
  8: 1.25,
  9: 1.15,
  10: 1.25,
};

export const ARROWHEADS = ['none', 'arrow', 'bar', 'dot', 'triangle', 'diamond'] as const;

// ---------------------------------------------------------------------------
// Estado do painel
// ---------------------------------------------------------------------------

export type PropKey =
  | 'strokeColor'
  | 'backgroundColor'
  | 'fillStyle'
  | 'strokeWidth'
  | 'strokeStyle'
  | 'roughness'
  | 'edges'
  | 'arrowType'
  | 'startArrowhead'
  | 'endArrowhead'
  | 'opacity'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'textAlign'
  | 'verticalAlign';

export interface PanelValues {
  strokeColor: string | null;
  backgroundColor: string | null;
  fillStyle: string | null;
  strokeWidth: number | null;
  strokeStyle: string | null;
  roughness: number | null;
  edges: 'sharp' | 'round' | null;
  arrowType: 'sharp' | 'round' | 'elbow' | null;
  startArrowhead: string | null;
  endArrowhead: string | null;
  opacity: number | null;
  fontFamily: number | null;
  fontSize: number | null;
  lineHeight: number | null;
  textAlign: string | null;
  verticalAlign: string | null;
}

export interface PanelShow {
  stroke: boolean;
  background: boolean;
  fill: boolean;
  strokeWidth: boolean;
  strokeStyle: boolean;
  roughness: boolean;
  edges: boolean;
  arrowType: boolean;
  arrowheads: boolean;
  text: boolean;
  verticalAlign: boolean;
  /** Texto formatado (caixa com `customData.rich`, ou imagem antiga) na seleção. */
  rich: boolean;
}

export interface PanelState {
  /** "selection": edita o que está selecionado. "tool": edita o padrão da ferramenta ativa. */
  mode: 'selection' | 'tool';
  count: number;
  show: PanelShow;
  values: PanelValues;
  canGroup: boolean;
  canUngroup: boolean;
  /** "Editar texto" tem o que abrir para esta seleção. */
  canEditText: boolean;
  /** Valores do texto formatado selecionado (`null` = valores diferentes). */
  rich: { fontSize: number | null; lineHeight: number | null } | null;
}

const DRAW_TOOLS = ['rectangle', 'diamond', 'ellipse', 'arrow', 'line', 'freedraw', 'text'];

const hasBackground = (t: string) => ['rectangle', 'diamond', 'ellipse', 'line', 'freedraw'].includes(t);
const hasStroke = (t: string) => t !== 'image' && t !== 'frame' && t !== 'magicframe';
const hasStrokeWidth = (t: string) => ['rectangle', 'diamond', 'ellipse', 'line', 'arrow', 'freedraw'].includes(t);
const hasStrokeStyle = (t: string) => ['rectangle', 'diamond', 'ellipse', 'line', 'arrow'].includes(t);
const hasRoundness = (t: string) => ['rectangle', 'diamond', 'line'].includes(t);

const isTransparent = (c: unknown) => !c || c === 'transparent';
const hasBoundText = (el: El) => !!el.boundElements?.some((b: any) => b.type === 'text');

/** Valor comum de uma lista, ou null se divergirem (ou se a lista for vazia). */
function common<T>(values: T[]): T | null {
  if (values.length === 0) return null;
  return values.every((v) => v === values[0]) ? values[0] : null;
}

function selectedIdsOf(appState: Record<string, any>): Set<string> {
  const map: Record<string, boolean> = appState?.selectedElementIds ?? {};
  return new Set(Object.keys(map).filter((id) => map[id]));
}

/** Textos que pertencem (label) aos contêineres selecionados. */
function boundTextsOf(selected: El[], byId: Map<string, El>): El[] {
  const out: El[] = [];
  for (const el of selected) {
    for (const b of el.boundElements ?? []) {
      if (b.type !== 'text') continue;
      const t = byId.get(b.id);
      if (t && !t.isDeleted) out.push(t);
    }
  }
  return out;
}

function showForTypes(types: string[], extras: { bg: string | null; anyOpaqueBg: boolean; text: boolean; verticalAlign: boolean }): PanelShow {
  const some = (pred: (t: string) => boolean) => types.some(pred);
  return {
    stroke: some(hasStroke),
    background: some(hasBackground),
    fill: some(hasBackground) && extras.anyOpaqueBg,
    strokeWidth: some(hasStrokeWidth),
    strokeStyle: some(hasStrokeStyle),
    roughness: some(hasStrokeStyle),
    edges: some(hasRoundness),
    arrowType: some((t) => t === 'arrow'),
    arrowheads: some((t) => t === 'arrow'),
    text: extras.text,
    verticalAlign: extras.verticalAlign,
    rich: false,
  };
}

/**
 * Lê elementos + appState do Excalidraw e devolve o que o painel deve
 * mostrar; `null` = painel escondido (nada selecionado e ferramenta que não
 * tem propriedades, como seleção/mão/borracha).
 */
export function derivePanelState(elements: readonly El[], appState: Record<string, any>): PanelState | null {
  const live = (elements as El[]).filter((el) => !el.isDeleted);
  const byId = new Map<string, El>(live.map((el) => [el.id, el]));
  const ids = selectedIdsOf(appState);
  const selected = live.filter((el) => ids.has(el.id));

  if (selected.length === 0) {
    const tool: string | undefined = appState?.activeTool?.type;
    if (!tool || !DRAW_TOOLS.includes(tool)) return null;
    const a = appState;
    const bg = a.currentItemBackgroundColor ?? 'transparent';
    return {
      mode: 'tool',
      count: 0,
      show: showForTypes([tool], {
        bg,
        anyOpaqueBg: !isTransparent(bg),
        text: tool === 'text',
        verticalAlign: false,
      }),
      values: {
        strokeColor: a.currentItemStrokeColor ?? '#1e1e1e',
        backgroundColor: bg,
        fillStyle: a.currentItemFillStyle ?? 'solid',
        strokeWidth: a.currentItemStrokeWidth ?? 2,
        strokeStyle: a.currentItemStrokeStyle ?? 'solid',
        roughness: a.currentItemRoughness ?? 1,
        edges: a.currentItemRoundness ?? 'round',
        arrowType: a.currentItemArrowType ?? 'round',
        startArrowhead: a.currentItemStartArrowhead ?? 'none',
        endArrowhead: a.currentItemEndArrowhead ?? 'arrow',
        opacity: a.currentItemOpacity ?? 100,
        fontFamily: a.currentItemFontFamily ?? 5,
        fontSize: a.currentItemFontSize ?? 20,
        lineHeight: null,
        textAlign: a.currentItemTextAlign ?? 'left',
        verticalAlign: null,
      },
      canGroup: false,
      canUngroup: false,
      canEditText: false,
      rich: null,
    };
  }

  // Texto formatado (caixa invisível + peças de texto nativo) é editado pelo editor e pelas
  // seções "Tamanho do texto" / "Espaço entre linhas"; as peças e a caixa não entram nas
  // outras seções (senão cor, fonte e fundo mexeriam em peças soltas e quebrariam o texto).
  const richEls = selected.filter(isRichHolder);
  const plain = selected.filter((el) => !isRichHolder(el) && !isRichPart(el));

  const types = plain.map((el) => el.type as string);
  const texts = [...plain.filter((el) => el.type === 'text'), ...boundTextsOf(plain, byId)];
  const withBg = plain.filter((el) => hasBackground(el.type));
  const withStyle = plain.filter((el) => hasStrokeStyle(el.type));
  const withRound = plain.filter((el) => hasRoundness(el.type));
  const arrows = plain.filter((el) => el.type === 'arrow');

  const topGroup = (el: El) => (el.groupIds?.length ? el.groupIds[el.groupIds.length - 1] : null);
  const firstGroup = topGroup(selected[0]);
  const allInSameGroup = selected.length > 1 && firstGroup !== null && selected.every((el) => topGroup(el) === firstGroup);

  return {
    mode: 'selection',
    count: selected.length,
    show: {
      ...showForTypes(types, {
        bg: null,
        anyOpaqueBg: withBg.some((el) => !isTransparent(el.backgroundColor)),
        text: texts.length > 0,
        verticalAlign: texts.some((t) => !!t.containerId) || plain.some(hasBoundText),
      }),
      rich: richEls.length > 0,
    },
    values: {
      strokeColor: common(plain.filter((el) => hasStroke(el.type)).map((el) => el.strokeColor ?? '#1e1e1e')),
      backgroundColor: common(withBg.map((el) => el.backgroundColor ?? 'transparent')),
      fillStyle: common(withBg.map((el) => el.fillStyle ?? 'solid')),
      strokeWidth: common(plain.filter((el) => hasStrokeWidth(el.type)).map((el) => el.strokeWidth ?? 2)),
      strokeStyle: common(withStyle.map((el) => el.strokeStyle ?? 'solid')),
      roughness: common(withStyle.map((el) => el.roughness ?? 1)),
      edges: common(withRound.map((el) => (el.roundness ? 'round' : 'sharp') as 'round' | 'sharp')),
      arrowType: common(
        arrows.map((el) => (el.elbowed ? 'elbow' : el.roundness ? 'round' : 'sharp') as 'sharp' | 'round' | 'elbow'),
      ),
      startArrowhead: common(arrows.map((el) => el.startArrowhead ?? 'none')),
      endArrowhead: common(arrows.map((el) => el.endArrowhead ?? 'none')),
      opacity: common(selected.map((el) => el.opacity ?? 100)),
      fontFamily: common(texts.map((el) => el.fontFamily as number)),
      fontSize: common(texts.map((el) => el.fontSize as number)),
      lineHeight: common(texts.map((el) => Number((el.lineHeight ?? LINE_HEIGHT[el.fontFamily] ?? 1.25).toFixed(2)))),
      textAlign: common(texts.map((el) => el.textAlign as string)),
      verticalAlign: common(texts.filter((el) => !!el.containerId).map((el) => el.verticalAlign as string)),
    },
    canGroup: selected.length > 1 && !allInSameGroup,
    canUngroup: plain.some((el) => el.groupIds?.length > 0),
    canEditText: resolveEditTarget(live, ids) !== null,
    rich: richEls.length
      ? {
          fontSize: common(richEls.map((el) => el.customData.rich.fontSize as number)),
          lineHeight: common(richEls.map((el) => Number((el.customData.rich.lineHeight as number).toFixed(2)))),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Medição de texto (o Excalidraw só recalcula largura/altura ao editar; aqui
// alteramos fonte/tamanho por fora, então precisamos refazer a medida)
// ---------------------------------------------------------------------------

let measureCtx: CanvasRenderingContext2D | null = null;

function fontString(fontSize: number, fontFamily: number): string {
  return `${fontSize}px ${FONT_CSS[fontFamily] ?? 'Excalifont'}, sans-serif`;
}

function textWidth(line: string, font: string): number {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return line.length * 10;
  measureCtx.font = font;
  return measureCtx.measureText(line).width;
}

/** Espera a fonte carregar (senão a medida sairia com a fonte reserva). */
export async function ensureFontLoaded(fontFamily: number, fontSize = 20): Promise<void> {
  try {
    await Promise.race([
      document.fonts.load(fontString(fontSize, fontFamily), 'Aa'),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch {
    /* segue com a medida possível */
  }
}

function wrapText(text: string, font: string, maxWidth: number): string {
  const out: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate, font) > maxWidth) {
        out.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    out.push(line);
  }
  return out.join('\n');
}

const BOUND_TEXT_PADDING = 5;

/** Área útil dentro do contêiner (elipse e losango têm área menor que a caixa). */
export function innerBox(container: El) {
  const { x, y, width: w, height: h } = container;
  if (container.type === 'ellipse') {
    const iw = Math.round((w / 2) * Math.SQRT2);
    const ih = Math.round((h / 2) * Math.SQRT2);
    return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
  }
  if (container.type === 'diamond') {
    const iw = Math.round(w / 2);
    const ih = Math.round(h / 2);
    return { x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih };
  }
  return { x, y, w, h };
}

/** Refaz texto quebrado, tamanho e posição de um elemento de texto já alterado. */
function relayoutText(el: El, byId: Map<string, El>, resetLineHeight: boolean): Partial<El> {
  const fontSize: number = el.fontSize;
  const fontFamily: number = el.fontFamily;
  // Trocar a fonte volta ao espaçamento padrão dela (como no Excalidraw); as
  // demais mudanças respeitam o espaçamento que o usuário escolheu.
  const lineHeight: number = resetLineHeight
    ? (LINE_HEIGHT[fontFamily] ?? 1.25)
    : (el.lineHeight ?? LINE_HEIGHT[fontFamily] ?? 1.25);
  const font = fontString(fontSize, fontFamily);
  const container = el.containerId ? byId.get(el.containerId) : null;
  const usableContainer = container && container.type !== 'arrow' ? container : null;

  let text: string = el.text;
  if (usableContainer) {
    const box = innerBox(usableContainer);
    text = wrapText(el.originalText ?? el.text, font, Math.max(box.w - BOUND_TEXT_PADDING * 2, fontSize));
  }
  const lines = text.split('\n');
  const width = Math.max(...lines.map((l) => textWidth(l, font)), 1);
  const height = lines.length * fontSize * lineHeight;

  let x = el.x;
  let y = el.y;
  if (usableContainer) {
    const box = innerBox(usableContainer);
    const p = BOUND_TEXT_PADDING;
    x = el.textAlign === 'left' ? box.x + p : el.textAlign === 'right' ? box.x + box.w - width - p : box.x + (box.w - width) / 2;
    y = el.verticalAlign === 'top' ? box.y + p : el.verticalAlign === 'bottom' ? box.y + box.h - height - p : box.y + (box.h - height) / 2;
  } else {
    // Texto solto: mantém ancorado pela borda que o alinhamento indica.
    if (el.textAlign === 'center') x = el.x + (el.width - width) / 2;
    else if (el.textAlign === 'right') x = el.x + el.width - width;
  }
  return { text, width, height, x, y, lineHeight, baseline: fontSize };
}

// ---------------------------------------------------------------------------
// Aplicar uma propriedade
// ---------------------------------------------------------------------------

const CURRENT_ITEM_KEY: Record<PropKey, string | null> = {
  strokeColor: 'currentItemStrokeColor',
  backgroundColor: 'currentItemBackgroundColor',
  fillStyle: 'currentItemFillStyle',
  strokeWidth: 'currentItemStrokeWidth',
  strokeStyle: 'currentItemStrokeStyle',
  roughness: 'currentItemRoughness',
  edges: 'currentItemRoundness',
  arrowType: 'currentItemArrowType',
  startArrowhead: 'currentItemStartArrowhead',
  endArrowhead: 'currentItemEndArrowhead',
  opacity: 'currentItemOpacity',
  fontFamily: 'currentItemFontFamily',
  fontSize: 'currentItemFontSize',
  lineHeight: null,
  textAlign: 'currentItemTextAlign',
  verticalAlign: null,
};

// Propriedades que, no Excalidraw, também valem para o texto do contêiner.
const INCLUDES_BOUND_TEXT: PropKey[] = ['strokeColor', 'opacity', 'fontFamily', 'fontSize', 'lineHeight', 'textAlign', 'verticalAlign'];
const TEXT_LAYOUT_KEYS: PropKey[] = ['fontFamily', 'fontSize', 'lineHeight', 'textAlign', 'verticalAlign'];

function bump(el: El, patch: Partial<El>): El {
  return {
    ...el,
    ...patch,
    version: (el.version ?? 1) + 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    updated: Date.now(),
  };
}

function elementPatch(key: PropKey, value: any, el: El): Partial<El> | null {
  // Texto formatado: só a opacidade vale para a caixa e as peças; o resto passa pelo
  // editor (que refaz o grupo inteiro a partir do conteúdo).
  if (isRichHolder(el) || isRichPart(el)) return key === 'opacity' ? { opacity: value } : null;
  const t: string = el.type;
  switch (key) {
    case 'strokeColor':
      return hasStroke(t) ? { strokeColor: value } : null;
    case 'backgroundColor':
      return hasBackground(t) ? { backgroundColor: value } : null;
    case 'fillStyle':
      return hasBackground(t) ? { fillStyle: value } : null;
    case 'strokeWidth':
      return hasStrokeWidth(t) ? { strokeWidth: value } : null;
    case 'strokeStyle':
      return hasStrokeStyle(t) ? { strokeStyle: value } : null;
    case 'roughness':
      return hasStrokeStyle(t) ? { roughness: value } : null;
    case 'edges':
      if (!hasRoundness(t)) return null;
      return { roundness: value === 'round' ? el.roundness ?? { type: t === 'rectangle' ? 3 : 2 } : null };
    case 'arrowType':
      if (t !== 'arrow') return null;
      // "sharp" e "round" só mudam o acabamento; o elbow exige recalcular a
      // rota da seta, o que a API pública não expõe — por isso não é oferecido.
      return value === 'round' ? { roundness: { type: 2 }, elbowed: false } : { roundness: null, elbowed: false };
    case 'startArrowhead':
      return t === 'arrow' ? { startArrowhead: value === 'none' ? null : value } : null;
    case 'endArrowhead':
      return t === 'arrow' ? { endArrowhead: value === 'none' ? null : value } : null;
    case 'opacity':
      return { opacity: value };
    case 'fontFamily':
      return t === 'text' ? { fontFamily: value } : null;
    case 'fontSize':
      return t === 'text' ? { fontSize: value } : null;
    case 'lineHeight':
      return t === 'text' ? { lineHeight: value } : null;
    case 'textAlign':
      return t === 'text' ? { textAlign: value } : null;
    case 'verticalAlign':
      return t === 'text' && el.containerId ? { verticalAlign: value } : null;
  }
}

/**
 * Aplica uma propriedade aos elementos selecionados (e ao texto dos
 * contêineres selecionados, quando o Excalidraw faria isso) e devolve o novo
 * array de elementos + o patch de appState (padrão dos próximos elementos).
 */
export function applyProperty(
  key: PropKey,
  value: any,
  allElements: readonly El[],
  selectedIds: Set<string>,
): { elements: El[]; appState: Record<string, unknown> } {
  const byId = new Map<string, El>((allElements as El[]).map((el) => [el.id, el]));
  const targetIds = new Set<string>();
  for (const id of selectedIds) if (byId.has(id)) targetIds.add(id);
  if (INCLUDES_BOUND_TEXT.includes(key)) {
    const selected = [...targetIds].map((id) => byId.get(id)!);
    for (const t of boundTextsOf(selected, byId)) targetIds.add(t.id);
  }

  const next = (allElements as El[]).map((el) => {
    if (!targetIds.has(el.id) || el.isDeleted) return el;
    const patch = elementPatch(key, value, el);
    if (!patch) return el;
    let updated = bump(el, patch);
    if (el.type === 'text' && TEXT_LAYOUT_KEYS.includes(key)) {
      updated = { ...updated, ...relayoutText(updated, byId, key === 'fontFamily') };
    }
    return updated;
  });

  const appState: Record<string, unknown> = {};
  const stateKey = CURRENT_ITEM_KEY[key];
  if (stateKey) {
    appState[stateKey] = (key === 'startArrowhead' || key === 'endArrowhead') && value === 'none' ? null : value;
  }
  return { elements: next, appState };
}

// ---------------------------------------------------------------------------
// Alinhar / distribuir / agrupar / travar
// ---------------------------------------------------------------------------

export type AlignMode = 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom';

interface Unit {
  ids: string[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Agrupa os selecionados em "unidades": cada grupo (mais externo) conta como um bloco só. */
function buildUnits(elements: El[], selectedIds: Set<string>): Unit[] {
  const byId = new Map<string, El>(elements.map((el) => [el.id, el]));
  const map = new Map<string, Unit>();
  for (const el of elements) {
    if (!selectedIds.has(el.id) || el.isDeleted) continue;
    const key = el.groupIds?.length ? `g:${el.groupIds[el.groupIds.length - 1]}` : `e:${el.id}`;
    const ids = [el.id];
    for (const b of el.boundElements ?? []) if (b.type === 'text' && byId.has(b.id)) ids.push(b.id);
    const u = map.get(key);
    if (u) {
      u.ids.push(...ids);
      u.minX = Math.min(u.minX, el.x);
      u.minY = Math.min(u.minY, el.y);
      u.maxX = Math.max(u.maxX, el.x + el.width);
      u.maxY = Math.max(u.maxY, el.y + el.height);
    } else {
      map.set(key, { ids, minX: el.x, minY: el.y, maxX: el.x + el.width, maxY: el.y + el.height });
    }
  }
  return [...map.values()];
}

function shiftUnits(elements: El[], shifts: Map<Unit, { dx: number; dy: number }>): El[] {
  const perId = new Map<string, { dx: number; dy: number }>();
  for (const [unit, d] of shifts) for (const id of unit.ids) perId.set(id, d);
  return elements.map((el) => {
    const d = perId.get(el.id);
    if (!d || (d.dx === 0 && d.dy === 0)) return el;
    return bump(el, { x: el.x + d.dx, y: el.y + d.dy });
  });
}

export function alignElements(elements: readonly El[], selectedIds: Set<string>, mode: AlignMode): El[] {
  const all = elements as El[];
  const units = buildUnits(all, selectedIds);
  if (units.length < 2) return all;
  const minX = Math.min(...units.map((u) => u.minX));
  const maxX = Math.max(...units.map((u) => u.maxX));
  const minY = Math.min(...units.map((u) => u.minY));
  const maxY = Math.max(...units.map((u) => u.maxY));
  const shifts = new Map<Unit, { dx: number; dy: number }>();
  for (const u of units) {
    let dx = 0;
    let dy = 0;
    if (mode === 'left') dx = minX - u.minX;
    else if (mode === 'right') dx = maxX - u.maxX;
    else if (mode === 'centerH') dx = (minX + maxX) / 2 - (u.minX + u.maxX) / 2;
    else if (mode === 'top') dy = minY - u.minY;
    else if (mode === 'bottom') dy = maxY - u.maxY;
    else dy = (minY + maxY) / 2 - (u.minY + u.maxY) / 2;
    shifts.set(u, { dx, dy });
  }
  return shiftUnits(all, shifts);
}

export function distributeElements(elements: readonly El[], selectedIds: Set<string>, axis: 'horizontal' | 'vertical'): El[] {
  const all = elements as El[];
  const units = buildUnits(all, selectedIds);
  if (units.length < 3) return all;
  const h = axis === 'horizontal';
  const lo = (u: Unit) => (h ? u.minX : u.minY);
  const hi = (u: Unit) => (h ? u.maxX : u.maxY);
  const sorted = [...units].sort((a, b) => lo(a) - lo(b));
  const span = Math.max(...sorted.map(hi)) - lo(sorted[0]);
  const total = sorted.reduce((sum, u) => sum + (hi(u) - lo(u)), 0);
  const gap = (span - total) / (sorted.length - 1);
  const shifts = new Map<Unit, { dx: number; dy: number }>();
  let cursor = lo(sorted[0]);
  for (const u of sorted) {
    const delta = cursor - lo(u);
    shifts.set(u, h ? { dx: delta, dy: 0 } : { dx: 0, dy: delta });
    cursor += hi(u) - lo(u) + gap;
  }
  return shiftUnits(all, shifts);
}

export function groupElements(elements: readonly El[], selectedIds: Set<string>): { elements: El[]; groupId: string } {
  const all = elements as El[];
  const groupId = generateId();
  const grouped = all.map((el) =>
    selectedIds.has(el.id) && !el.isDeleted ? bump(el, { groupIds: [...(el.groupIds ?? []), groupId] }) : el,
  );
  // Mantém os membros do grupo juntos no array (a ordem do array é a camada).
  const isMember = (el: El) => selectedIds.has(el.id) && !el.isDeleted;
  let lastIdx = -1;
  grouped.forEach((el, i) => {
    if (isMember(el)) lastIdx = i;
  });
  const members = grouped.filter(isMember);
  const result = [
    ...grouped.slice(0, lastIdx + 1).filter((el) => !isMember(el)),
    ...members,
    ...grouped.slice(lastIdx + 1),
  ];
  return { elements: result, groupId };
}

export function ungroupElements(elements: readonly El[], selectedIds: Set<string>): El[] {
  const all = elements as El[];
  const toRemove = new Set<string>();
  for (const el of all) {
    if (selectedIds.has(el.id) && el.groupIds?.length) toRemove.add(el.groupIds[el.groupIds.length - 1]);
  }
  if (toRemove.size === 0) return all;
  return all.map((el) =>
    el.groupIds?.some((g: string) => toRemove.has(g))
      ? bump(el, { groupIds: el.groupIds.filter((g: string) => !toRemove.has(g)) })
      : el,
  );
}

export function lockElements(elements: readonly El[], selectedIds: Set<string>): El[] {
  return (elements as El[]).map((el) => (selectedIds.has(el.id) ? bump(el, { locked: true }) : el));
}
