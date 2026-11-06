import { Page, PaperStyle } from '../types';
import { PageKind, getPageKinds } from './pageKinds';
import { parsePageDate, startOfDay } from './date';

/** Filtros da lista de páginas ("Todas as páginas" / "Favoritos"). */
export interface PageFilters {
  /** Busca no título, número, matéria e tópico. */
  query: string;
  subjectId: string | null;
  topicId: string | null;
  /** Tipo de folha. Vazio = todos. */
  paper: PaperStyle[];
  /** Conteúdo (texto, desenho…). Vazio = todos; com vários, basta ter UM deles. */
  kinds: PageKind[];
  /** Intervalo de datas (meia-noite local, inclusivo nas duas pontas). */
  dateFrom: number | null;
  dateTo: number | null;
  /** Só favoritas (na tela "Favoritos" já é sempre assim). */
  onlyFavorites: boolean;
}

export type SortKey = 'number' | 'date' | 'title' | 'updated';
export type SortDir = 'asc' | 'desc';

export interface PageSort {
  key: SortKey;
  dir: SortDir;
}

export const DEFAULT_FILTERS: PageFilters = {
  query: '',
  subjectId: null,
  topicId: null,
  paper: [],
  kinds: [],
  dateFrom: null,
  dateTo: null,
  onlyFavorites: false,
};

export const DEFAULT_SORT: PageSort = { key: 'number', dir: 'asc' };

export const SORT_LABEL: Record<SortKey, string> = {
  number: 'Número da página',
  date: 'Data da página',
  title: 'Título (A–Z)',
  updated: 'Última edição',
};

export const PAPER_LABEL: Record<PaperStyle, string> = {
  ruled: 'Pautada',
  blank: 'Branca',
  grid: 'Quadriculada',
};

export interface NameLookup {
  subjectName: (id: string) => string;
  topicName: (id: string) => string;
}

/** Data efetiva da página: a do cabeçalho; se ela não for uma data válida, a de criação. */
export function pageDay(page: Page): number {
  return parsePageDate(page.date) ?? startOfDay(page.createdAt);
}

const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function matchesFilters(page: Page, f: PageFilters, names: NameLookup): boolean {
  if (f.onlyFavorites && !page.isFavorite) return false;
  if (f.subjectId && page.subjectId !== f.subjectId) return false;
  if (f.topicId && page.topicId !== f.topicId) return false;
  if (f.paper.length > 0 && !f.paper.includes(page.paperStyle ?? 'ruled')) return false;

  if (f.kinds.length > 0) {
    const have = getPageKinds(page);
    if (!f.kinds.some((k) => have.has(k))) return false;
  }

  if (f.dateFrom !== null || f.dateTo !== null) {
    const day = pageDay(page);
    if (f.dateFrom !== null && day < f.dateFrom) return false;
    if (f.dateTo !== null && day > f.dateTo) return false;
  }

  const q = fold(f.query.trim());
  // "pagina 12", "pag 12", "p. 12" ou "#12": procura exatamente aquela página.
  const byNumber = /^(?:pagina|pag|pg|p|#)\.?\s*(\d+)$/.exec(q);
  if (byNumber) return page.number === Number(byNumber[1]);
  if (q) {
    const haystack = fold(
      [`pagina ${page.number}`, String(page.number), page.title, names.subjectName(page.subjectId), names.topicName(page.topicId)].join(' '),
    );
    // Todas as palavras digitadas precisam aparecer (em qualquer ordem).
    if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  return true;
}

export function sortPages(pages: Page[], sort: PageSort): Page[] {
  const sign = sort.dir === 'asc' ? 1 : -1;
  const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
  const value = (p: Page): number | string => {
    switch (sort.key) {
      case 'date':
        return pageDay(p);
      case 'title':
        return p.title.trim() || `\uffff${p.number}`; // sem título vai para o fim
      case 'updated':
        return p.updatedAt;
      default:
        return p.number;
    }
  };
  return [...pages].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : collator.compare(String(va), String(vb));
    return (cmp || a.number - b.number) * sign;
  });
}

/** Quantos filtros estão ligados (para o contador do botão "Filtros"). A busca por texto não entra: ela tem o próprio campo. */
export function activeFilterCount(f: PageFilters, hideFavorites = false): number {
  let n = 0;
  if (f.subjectId) n++;
  if (f.topicId) n++;
  if (f.paper.length) n++;
  if (f.kinds.length) n++;
  if (f.dateFrom !== null || f.dateTo !== null) n++;
  if (!hideFavorites && f.onlyFavorites) n++;
  return n;
}

export function hasAnyFilter(f: PageFilters, hideFavorites = false): boolean {
  return f.query.trim() !== '' || activeFilterCount(f, hideFavorites) > 0;
}

/** Atalhos de período. */
export type DatePreset = 'today' | '7d' | '30d' | 'month' | 'year';

export const DATE_PRESET_LABEL: Record<DatePreset, string> = {
  today: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  month: 'Este mês',
  year: 'Este ano',
};

export function presetRange(preset: DatePreset, now = new Date()): { from: number; to: number } {
  const today = startOfDay(now.getTime());
  const day = (offset: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset).getTime();
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case '7d':
      return { from: day(-6), to: today };
    case '30d':
      return { from: day(-29), to: today };
    case 'month':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).getTime(), to: today };
    case 'year':
      return { from: new Date(now.getFullYear(), 0, 1).getTime(), to: today };
  }
}
