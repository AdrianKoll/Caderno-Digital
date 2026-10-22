import { useMemo, useState } from 'react';
import { Subject, Topic } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';
import { PAGE_KIND_LABEL, PageKind } from '../../utils/pageKinds';
import {
  DATE_PRESET_LABEL,
  DEFAULT_SORT,
  DatePreset,
  PAPER_LABEL,
  PageFilters,
  SORT_LABEL,
  SortKey,
  activeFilterCount,
  hasAnyFilter,
  presetRange,
} from '../../utils/pageFilters';
import { PaperStyle } from '../../types';
import { fromDateInputValue, toDateInputValue } from '../../utils/date';
import './ListFilters.css';

interface Props {
  subjects: Subject[];
  topics: Topic[];
  /** Quantas páginas passam nos filtros / quantas existem na tela. */
  shown: number;
  total: number;
  /** Na tela "Favoritos" o filtro de favoritas não faz sentido. */
  hideFavoritesToggle?: boolean;
}

const PAPERS: PaperStyle[] = ['ruled', 'blank', 'grid'];
const KINDS: PageKind[] = ['text', 'drawing', 'shapes', 'image', 'empty'];
const PRESETS: DatePreset[] = ['today', '7d', '30d', 'month', 'year'];
const SORT_KEYS: SortKey[] = ['number', 'date', 'title', 'updated'];

/**
 * Barra de filtros da lista de páginas: busca, ordem e um painel com matéria,
 * tópico, período, tipo de folha e conteúdo. Fica guardada no store, então ao
 * abrir uma página e voltar os filtros continuam do jeito que estavam.
 */
export function ListFilters({ subjects, topics, shown, total, hideFavoritesToggle }: Props) {
  const filters = useNotebookStore((s) => s.listFilters);
  const sort = useNotebookStore((s) => s.listSort);
  const setFilters = useNotebookStore((s) => s.setListFilters);
  const setSort = useNotebookStore((s) => s.setListSort);
  const reset = useNotebookStore((s) => s.resetListFilters);
  const [open, setOpen] = useState(false);

  const count = activeFilterCount(filters, hideFavoritesToggle);
  const filtered = hasAnyFilter(filters, hideFavoritesToggle);

  const subjectName = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const topicOptions = useMemo(
    () => topics.filter((t) => !filters.subjectId || t.subjectId === filters.subjectId).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [topics, filters.subjectId],
  );

  const toggle = <T,>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  const activePreset = PRESETS.find((p) => {
    if (filters.dateFrom === null || filters.dateTo === null) return false;
    const r = presetRange(p);
    return r.from === filters.dateFrom && r.to === filters.dateTo;
  });

  // ---- Resumo dos filtros ligados (aparece com o painel fechado) ----
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.subjectId) chips.push({ key: 'subject', label: subjectName.get(filters.subjectId) ?? 'Matéria', clear: () => setFilters({ subjectId: null, topicId: null }) });
  if (filters.topicId) chips.push({ key: 'topic', label: topics.find((t) => t.id === filters.topicId)?.name ?? 'Tópico', clear: () => setFilters({ topicId: null }) });
  if (filters.dateFrom !== null || filters.dateTo !== null) {
    const fmt = (ts: number) => new Date(ts).toLocaleDateString('pt-BR');
    const label =
      activePreset ? DATE_PRESET_LABEL[activePreset] : filters.dateFrom !== null && filters.dateTo !== null ? `${fmt(filters.dateFrom)} – ${fmt(filters.dateTo)}` : filters.dateFrom !== null ? `desde ${fmt(filters.dateFrom)}` : `até ${fmt(filters.dateTo!)}`;
    chips.push({ key: 'date', label, clear: () => setFilters({ dateFrom: null, dateTo: null }) });
  }
  if (filters.paper.length) chips.push({ key: 'paper', label: filters.paper.map((p) => PAPER_LABEL[p]).join(', '), clear: () => setFilters({ paper: [] }) });
  if (filters.kinds.length) chips.push({ key: 'kinds', label: filters.kinds.map((k) => PAGE_KIND_LABEL[k]).join(', '), clear: () => setFilters({ kinds: [] }) });
  if (!hideFavoritesToggle && filters.onlyFavorites) chips.push({ key: 'fav', label: 'Favoritas', clear: () => setFilters({ onlyFavorites: false }) });

  return (
    <section className="list-filters" aria-label="Filtros da lista de páginas">
      <div className="list-filters__bar">
        <label className="list-filters__search">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="search"
            value={filters.query}
            placeholder="Buscar por título, número, matéria ou tópico"
            aria-label="Buscar páginas"
            onChange={(e) => setFilters({ query: e.target.value })}
          />
          {filters.query && (
            <button type="button" className="list-filters__clear-q" aria-label="Limpar busca" onClick={() => setFilters({ query: '' })}>
              <i className="bi bi-x-lg" />
            </button>
          )}
        </label>

        <div className="list-filters__sort">
          <select
            aria-label="Ordenar por"
            value={sort.key}
            onChange={(e) => {
              const key = e.target.value as SortKey;
              // Data e última edição começam pela mais recente; o resto, do começo.
              setSort({ key, dir: key === 'date' || key === 'updated' ? 'desc' : 'asc' });
            }}
          >
            {SORT_KEYS.map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="list-filters__dir"
            aria-label={sort.dir === 'asc' ? 'Ordem crescente (clique para inverter)' : 'Ordem decrescente (clique para inverter)'}
            title={sort.dir === 'asc' ? 'Crescente' : 'Decrescente'}
            onClick={() => setSort({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
          >
            <i className={`bi ${sort.dir === 'asc' ? 'bi-sort-down-alt' : 'bi-sort-down'}`} />
          </button>
        </div>

        <button
          type="button"
          className={`list-filters__toggle ${open ? 'is-open' : ''} ${count > 0 ? 'has-active' : ''}`}
          aria-expanded={open}
          aria-controls="list-filters-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <i className="bi bi-funnel" aria-hidden="true" />
          <span>Filtros</span>
          {count > 0 && <span className="list-filters__badge">{count}</span>}
        </button>
      </div>

      {open && (
        <div id="list-filters-panel" className="list-filters__panel">
          <div className="list-filters__field">
            <label htmlFor="flt-subject">Matéria</label>
            <select
              id="flt-subject"
              value={filters.subjectId ?? ''}
              onChange={(e) => setFilters({ subjectId: e.target.value || null, topicId: null })}
            >
              <option value="">Todas</option>
              {[...subjects].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="list-filters__field">
            <label htmlFor="flt-topic">Tópico</label>
            <select id="flt-topic" value={filters.topicId ?? ''} onChange={(e) => setFilters({ topicId: e.target.value || null })}>
              <option value="">Todos</option>
              {topicOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {filters.subjectId ? t.name : `${subjectName.get(t.subjectId) ?? '—'} › ${t.name}`}
                </option>
              ))}
            </select>
          </div>

          <div className="list-filters__field list-filters__field--wide">
            <span className="list-filters__legend">Período (data da página)</span>
            <div className="list-filters__chips">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${activePreset === p ? 'is-on' : ''}`}
                  aria-pressed={activePreset === p}
                  onClick={() => {
                    if (activePreset === p) return setFilters({ dateFrom: null, dateTo: null });
                    const r = presetRange(p);
                    setFilters({ dateFrom: r.from, dateTo: r.to });
                  }}
                >
                  {DATE_PRESET_LABEL[p]}
                </button>
              ))}
            </div>
            <div className="list-filters__dates">
              <label>
                De
                <input
                  type="date"
                  value={filters.dateFrom !== null ? toDateInputValue(filters.dateFrom) : ''}
                  max={filters.dateTo !== null ? toDateInputValue(filters.dateTo) : undefined}
                  onChange={(e) => setFilters({ dateFrom: fromDateInputValue(e.target.value) })}
                />
              </label>
              <label>
                Até
                <input
                  type="date"
                  value={filters.dateTo !== null ? toDateInputValue(filters.dateTo) : ''}
                  min={filters.dateFrom !== null ? toDateInputValue(filters.dateFrom) : undefined}
                  onChange={(e) => setFilters({ dateTo: fromDateInputValue(e.target.value) })}
                />
              </label>
            </div>
          </div>

          <div className="list-filters__field">
            <span className="list-filters__legend">Tipo de folha</span>
            <div className="list-filters__chips">
              {PAPERS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip ${filters.paper.includes(p) ? 'is-on' : ''}`}
                  aria-pressed={filters.paper.includes(p)}
                  onClick={() => setFilters({ paper: toggle(filters.paper, p) })}
                >
                  {PAPER_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          <div className="list-filters__field">
            <span className="list-filters__legend">Conteúdo</span>
            <div className="list-filters__chips">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`chip ${filters.kinds.includes(k) ? 'is-on' : ''}`}
                  aria-pressed={filters.kinds.includes(k)}
                  onClick={() => setFilters({ kinds: toggle(filters.kinds, k) })}
                >
                  {PAGE_KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          {!hideFavoritesToggle && (
            <div className="list-filters__field">
              <span className="list-filters__legend">Favoritos</span>
              <div className="list-filters__chips">
                <button
                  type="button"
                  className={`chip ${filters.onlyFavorites ? 'is-on' : ''}`}
                  aria-pressed={filters.onlyFavorites}
                  onClick={() => setFilters({ onlyFavorites: !filters.onlyFavorites })}
                >
                  <i className="bi bi-star-fill" aria-hidden="true" /> Só favoritas
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(chips.length > 0 || filtered || sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) && (
        <div className="list-filters__summary">
          <span className="list-filters__result" role="status">
            {shown} de {total} {total === 1 ? 'página' : 'páginas'}
          </span>
          {!open &&
            chips.map((c) => (
              <button key={c.key} type="button" className="chip chip--removable" onClick={c.clear} title="Remover este filtro">
                {c.label}
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            ))}
          {filtered && (
            <button type="button" className="list-filters__reset" onClick={reset}>
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </section>
  );
}
