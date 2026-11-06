import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { deletePage, permanentlyDeletePage, restorePage } from '../../db/pages';
import { useNotebookStore } from '../../store/notebookStore';
import { ListFilters } from './ListFilters';
import { hasAnyFilter, matchesFilters, sortPages } from '../../utils/pageFilters';
import './ListView.css';
const VIEW_META: Record<string, { title: string; subtitle: string; icon: string }> = {
  all: { title: 'Todas as páginas', subtitle: 'Tudo o que você já escreveu, em um só lugar.', icon: 'bi-collection-fill' },
  favorites: { title: 'Favoritos', subtitle: 'Suas páginas marcadas com estrela.', icon: 'bi-star-fill' },
  trash: { title: 'Lixeira', subtitle: 'Páginas excluídas.', icon: 'bi-trash3-fill' },
};
export function ListView() {
  const view = useNotebookStore((s) => s.view);
  const selectPage = useNotebookStore((s) => s.selectPage);
  const openRename = useNotebookStore((s) => s.openRename);
  const filters = useNotebookStore((s) => s.listFilters);
  const sort = useNotebookStore((s) => s.listSort);
  const resetFilters = useNotebookStore((s) => s.resetListFilters);
  const pages = useLiveQuery(() => db.pages.orderBy('number').toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const topics = useLiveQuery(() => db.topics.toArray(), []);
  const subjectById = useMemo(() => new Map((subjects ?? []).map((s) => [s.id, s])), [subjects]);
  const topicById = useMemo(() => new Map((topics ?? []).map((t) => [t.id, t])), [topics]);
  const base = useMemo(() => (pages ?? []).filter((p) => view === 'trash' ? !!p.deletedAt : !p.deletedAt && (view !== 'favorites' || p.isFavorite)), [pages, view]);
  const filtered = useMemo(() => {
    const names = { subjectName: (id: string) => subjectById.get(id)?.name ?? '', topicName: (id: string) => topicById.get(id)?.name ?? '' };
    return sortPages(base.filter((p) => matchesFilters(p, view === 'favorites' ? { ...filters, onlyFavorites: false } : filters, names)), sort);
  }, [base, filters, sort, subjectById, topicById, view]);
  if (!pages || !subjects || !topics) return null;
  const meta = VIEW_META[view] ?? VIEW_META.all;
  const count = base.length;
  const isFiltered = hasAnyFilter(filters, view === 'favorites');
  return (
    <div className="list-view">
      <header className="list-view__header">
        <span className={`list-view__header-icon list-view__header-icon--${view}`}><i className={`bi ${meta.icon}`} /></span>
        <div className="list-view__header-text"><h2>{meta.title}</h2><p>{meta.subtitle}</p></div>
        <span className="list-view__count">{count} {count === 1 ? 'página' : 'páginas'}</span>
      </header>
      {view === 'trash' && base.length === 0 && (
        <div className="list-view__empty"><span className="list-view__empty-icon"><i className="bi bi-trash3" /></span><h3>A lixeira está vazia</h3><p>Páginas excluídas aparecem aqui e podem ser restauradas ou removidas definitivamente.</p></div>
      )}
      {view === 'trash' && base.length > 0 && (
        <div className="list-view__grid">
          {base.map((p) => (
            <article key={p.id} className="page-card">
              <div className="page-card__main page-card__trash-main">
                <span className="page-card__number"><i className="bi bi-trash3" /> Página {p.number}</span>
                <span className="page-card__title">{p.title || 'Sem título'}</span>
                <span className="page-card__date">Excluída em {new Date(p.deletedAt!).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="page-card__trash-actions">
                <button type="button" aria-label={`Restaurar página ${p.number}`} onClick={() => void restorePage(p.id)}><i className="bi bi-arrow-counterclockwise" /> Restaurar</button>
                <button type="button" aria-label={`Excluir página ${p.number} permanentemente`} onClick={() => { if (confirm(`Excluir definitivamente a Página ${p.number}? Esta ação não pode ser desfeita.`)) void permanentlyDeletePage(p.id); }}><i className="bi bi-trash3" /> Excluir</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {view !== 'trash' && base.length > 0 && <ListFilters subjects={subjects} topics={topics} shown={filtered.length} total={base.length} hideFavoritesToggle={view === 'favorites'} />}
      {view !== 'trash' && base.length > 0 && filtered.length === 0 && isFiltered && (
        <div className="list-view__empty"><span className="list-view__empty-icon"><i className="bi bi-funnel" /></span><h3>Nenhuma página encontrada</h3><p>Nenhuma página combina com os filtros escolhidos. Tente tirar algum filtro ou ampliar o período.</p><button type="button" className="list-view__empty-btn" onClick={resetFilters}>Limpar filtros</button></div>
      )}
      {view !== 'trash' && base.length === 0 && (
        <div className="list-view__empty"><span className="list-view__empty-icon"><i className={`bi ${view === 'favorites' ? 'bi-star' : 'bi-file-earmark-plus'}`} /></span><h3>{view === 'favorites' ? 'Nenhum favorito ainda' : 'Nenhuma página aqui ainda'}</h3><p>{view === 'favorites' ? 'Clique na estrela no canto da folha para favoritar uma página.' : 'Crie uma matéria e um tópico no menu e adicione a sua primeira página.'}</p></div>
      )}
      {view !== 'trash' && filtered.length > 0 && (
        <div className="list-view__grid">
          {filtered.map((p) => {
            const subject = subjectById.get(p.subjectId);
            const topic = topicById.get(p.topicId);
            return (
              <article key={p.id} className={`page-card ${view === 'all' ? 'page-card--deletable' : ''}`}>
                <button type="button" className="page-card__main" onClick={() => selectPage(p.subjectId, p.topicId, p.id)}>
                  <span className="page-card__top"><span className="page-card__number"><i className="bi bi-file-earmark-text" /> Página {p.number}</span>{p.isFavorite && <i className="bi bi-star-fill page-card__fav" />}</span>
                  <span className="page-card__title">{p.title || 'Sem título'}</span>
                  <span className="page-card__path"><i className="bi bi-folder2-open" /><span>{subject?.name ?? '—'}<i className="bi bi-chevron-right page-card__sep" />{topic?.name ?? '—'}</span></span>
                  <span className="page-card__date"><i className="bi bi-calendar3" />{p.date}</span>
                </button>
                <button type="button" className="page-card__rename" title="Renomear página" aria-label={`Renomear página ${p.number}`} onClick={() => openRename({ kind: 'page', id: p.id })}><i className="bi bi-pencil" /></button>
                {view === 'all' && (
                  <button
                    type="button"
                    className="page-card__delete"
                    title="Mover para a lixeira"
                    aria-label={`Mover página ${p.number} para a lixeira`}
                    onClick={() => {
                      if (confirm(`Mover a Página ${p.number} para a lixeira? Você poderá restaurá-la depois.`)) {
                        void deletePage(p.id);
                      }
                    }}
                  >
                    <i className="bi bi-trash3" aria-hidden="true" />
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
