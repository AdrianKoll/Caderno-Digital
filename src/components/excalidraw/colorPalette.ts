/**
 * Paleta de cores no mesmo esquema do seletor do Excalidraw: uma lista de
 * "cores" (matizes) e, para cada uma, 5 tons do mais claro ao mais escuro.
 * Os valores vêm da open-color (a mesma base do Excalidraw), tons
 * 0, 2, 4, 6 e 8 de cada matiz.
 */
export interface Hue {
  key: string;
  label: string;
  shades: [string, string, string, string, string];
}

export const HUES: Hue[] = [
  { key: 'gray', label: 'Cinza', shades: ['#f8f9fa', '#e9ecef', '#ced4da', '#868e96', '#343a40'] },
  { key: 'red', label: 'Vermelho', shades: ['#fff5f5', '#ffc9c9', '#ff8787', '#fa5252', '#e03131'] },
  { key: 'pink', label: 'Rosa', shades: ['#fff0f6', '#fcc2d7', '#f783ac', '#e64980', '#c2255c'] },
  { key: 'grape', label: 'Uva', shades: ['#f8f0fc', '#eebefa', '#da77f2', '#be4bdb', '#9c36b5'] },
  { key: 'violet', label: 'Violeta', shades: ['#f3f0ff', '#d0bfff', '#9775fa', '#7950f2', '#6741d9'] },
  { key: 'indigo', label: 'Índigo', shades: ['#edf2ff', '#bac8ff', '#748ffc', '#4c6ef5', '#3b5bdb'] },
  { key: 'blue', label: 'Azul', shades: ['#e7f5ff', '#a5d8ff', '#4dabf7', '#228be6', '#1971c2'] },
  { key: 'cyan', label: 'Ciano', shades: ['#e3fafc', '#99e9f2', '#3bc9db', '#15aabf', '#0c8599'] },
  { key: 'teal', label: 'Verde-água', shades: ['#e6fcf5', '#96f2d7', '#38d9a9', '#12b886', '#099268'] },
  { key: 'green', label: 'Verde', shades: ['#ebfbee', '#b2f2bb', '#69db7e', '#40c057', '#2f9e44'] },
  { key: 'yellow', label: 'Amarelo', shades: ['#fff9db', '#ffec99', '#ffd43b', '#fab005', '#f08c00'] },
  { key: 'orange', label: 'Laranja', shades: ['#fff4e6', '#ffd8a8', '#ffa94d', '#fd7e14', '#e8590c'] },
  { key: 'bronze', label: 'Bronze', shades: ['#f8f1ee', '#eaddd7', '#d2bab0', '#a18072', '#846358'] },
];

export const BLACK = '#1e1e1e';
export const WHITE = '#ffffff';
export const TRANSPARENT = 'transparent';

/** Atalhos rápidos ao lado do rótulo — os mesmos 5 do Excalidraw. */
export const STROKE_TOP_PICKS = [BLACK, '#e03131', '#2f9e44', '#1971c2', '#f08c00'];
export const BACKGROUND_TOP_PICKS = [TRANSPARENT, '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99'];

/** Cores "soltas" (fora dos matizes) no topo da grade: preto e branco. */
export const BASE_COLORS = [BLACK, WHITE];

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex);
}

export function normalizeHex(hex: string): string {
  const h = hex.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(h)) return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  return h;
}

/** Acha o matiz que contém a cor (para mostrar os "tons" dele). */
export function findHue(color: string): Hue | null {
  const c = color.toLowerCase();
  return HUES.find((h) => h.shades.includes(c)) ?? null;
}
