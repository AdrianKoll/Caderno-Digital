import { MarkerKind, Para } from './types';

export interface MarkerDef {
  kind: MarkerKind;
  label: string;
  group: 'bullet' | 'number';
  /** Amostra mostrada na biblioteca. */
  sample: string;
}

/** Biblioteca de marcadores, no espírito da galeria de marcadores e numeração do Word. */
export const MARKERS: MarkerDef[] = [
  { kind: 'dot', label: 'Círculo cheio', group: 'bullet', sample: '•' },
  { kind: 'circle', label: 'Círculo vazado', group: 'bullet', sample: '◦' },
  { kind: 'square', label: 'Quadrado', group: 'bullet', sample: '▪' },
  { kind: 'diamond', label: 'Losango', group: 'bullet', sample: '◆' },
  { kind: 'arrow', label: 'Seta', group: 'bullet', sample: '➤' },
  { kind: 'check', label: 'Marca de seleção', group: 'bullet', sample: '✓' },
  { kind: 'star', label: 'Estrela', group: 'bullet', sample: '★' },
  { kind: 'dash', label: 'Traço', group: 'bullet', sample: '–' },
  { kind: 'box', label: 'Caixa de seleção', group: 'bullet', sample: '☐' },
  { kind: 'num-dot', label: '1. 2. 3.', group: 'number', sample: '1.' },
  { kind: 'num-paren', label: '1) 2) 3)', group: 'number', sample: '1)' },
  { kind: 'alpha-lower', label: 'a) b) c)', group: 'number', sample: 'a)' },
  { kind: 'alpha-upper', label: 'A. B. C.', group: 'number', sample: 'A.' },
  { kind: 'roman-lower', label: 'i. ii. iii.', group: 'number', sample: 'i.' },
  { kind: 'roman-upper', label: 'I. II. III.', group: 'number', sample: 'I.' },
];

const BULLET_GLYPH: Partial<Record<MarkerKind, string>> = Object.fromEntries(
  MARKERS.filter((m) => m.group === 'bullet').map((m) => [m.kind, m.sample]),
);

export function isNumbered(kind: MarkerKind): boolean {
  return MARKERS.some((m) => m.kind === kind && m.group === 'number');
}

function alpha(n: number): string {
  let s = '';
  let x = n;
  while (x > 0) {
    x -= 1;
    s = String.fromCharCode(97 + (x % 26)) + s;
    x = Math.floor(x / 26);
  }
  return s || 'a';
}

function roman(n: number): string {
  const table: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
    [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ];
  let out = '';
  let x = n;
  for (const [v, s] of table) {
    while (x >= v) {
      out += s;
      x -= v;
    }
  }
  return out || 'i';
}

function formatNumber(kind: MarkerKind, n: number): string {
  switch (kind) {
    case 'num-dot':
      return `${n}.`;
    case 'num-paren':
      return `${n})`;
    case 'alpha-lower':
      return `${alpha(n)})`;
    case 'alpha-upper':
      return `${alpha(n).toUpperCase()}.`;
    case 'roman-lower':
      return `${roman(n)}.`;
    case 'roman-upper':
      return `${roman(n).toUpperCase()}.`;
    default:
      return '';
  }
}

/**
 * Texto do marcador de cada parágrafo ('' = sem marcador). A numeração
 * continua entre parágrafos seguidos do mesmo tipo e nível, e reinicia
 * quando a sequência é interrompida (como no Word). O editor e o desenho
 * usam esta mesma função, então a numeração sai idêntica nos dois.
 */
export function markerLabels(paras: Pick<Para, 'marker' | 'indent'>[]): string[] {
  const counters = new Map<number, { kind: MarkerKind; n: number }>();
  return paras.map((p) => {
    // Interrompe as sequências deste nível para baixo.
    if (!isNumbered(p.marker)) {
      for (const level of [...counters.keys()]) if (level >= p.indent) counters.delete(level);
      return BULLET_GLYPH[p.marker] ?? '';
    }
    for (const level of [...counters.keys()]) if (level > p.indent) counters.delete(level);
    const current = counters.get(p.indent);
    if (current && current.kind === p.marker) current.n += 1;
    else counters.set(p.indent, { kind: p.marker, n: 1 });
    return formatNumber(p.marker, counters.get(p.indent)!.n);
  });
}
