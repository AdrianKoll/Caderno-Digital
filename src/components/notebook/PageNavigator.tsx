import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../db/db';
import { createPage } from '../../db/pages';
import { Page } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';
import './PageNavigator.css';

interface PageInfo {
  id: string;
  number: number;
  subjectId: string;
  topicId: string;
  title: string;
  date: string;
  isFavorite: boolean;
}

const WINDOW = 7; // quantas folhas aparecem de uma vez na faixa

/**
 * Troca de folhas do tópico, no estilo fichário: uma faixa de folhas
 * numeradas (clica e vai direto), setas, "+" para uma folha nova e, no
 * celular, um botão "2/5" que abre a lista completa. Atalho: Alt+Shift+←/→.
 */
export function PageNavigator({ page }: { page: Page }) {
  const selectPage = useNotebookStore((s) => s.selectPage);
  const [listOpen, setListOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const siblings = useLiveQuery(async () => {
<<<<<<< HEAD
    const pages = await db.pages.where('topicId').equals(page.topicId).sortBy('number').then((rows) => rows.filter((p) => !p.deletedAt));
=======
    const pages = await db.pages.where('topicId').equals(page.topicId).sortBy('number');
>>>>>>> origin/main
    return pages.map<PageInfo>((p) => ({
      id: p.id,
      number: p.number,
      subjectId: p.subjectId,
      topicId: p.topicId,
      title: p.title,
      date: p.date,
      isFavorite: p.isFavorite,
    }));
  }, [page.topicId]);

  const index = siblings ? siblings.findIndex((p) => p.id === page.id) : -1;
  const prev = siblings && index > 0 ? siblings[index - 1] : null;
  const next = siblings && index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;

  const goTo = (p: PageInfo | null) => {
    if (p) selectPage(p.subjectId, p.topicId, p.id);
    setListOpen(false);
  };

  async function addPage() {
    const created = await createPage(page.subjectId, page.topicId);
    selectPage(created.subjectId, created.topicId, created.id);
  }

  // Atalho de teclado (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || !e.shiftKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const target = e.key === 'ArrowLeft' ? prev : next;
      if (!target) return;
      e.preventDefault();
      selectPage(target.subjectId, target.topicId, target.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, selectPage]);

  // Fecha a lista ao clicar fora ou com Esc.
  useEffect(() => {
    if (!listOpen) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setListOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setListOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [listOpen]);

  if (!siblings) return null;

  // Janela de folhas ao redor da atual.
  const total = siblings.length;
  const start = Math.max(0, Math.min(index - Math.floor(WINDOW / 2), total - WINDOW));
  const visible = siblings.slice(start, start + WINDOW);
  const hiddenBefore = start > 0;
  const hiddenAfter = start + WINDOW < total;
  const label = (p: PageInfo) => `Página ${p.number}${p.title ? ` · ${p.title}` : ''} · ${p.date}`;

  return (
    <div className="page-nav" ref={rootRef}>
      <button type="button" className="page-nav__arrow" aria-label="Página anterior" title="Página anterior (Alt+Shift+←)" disabled={!prev} onClick={() => goTo(prev)}>
        <i className="bi bi-chevron-left" />
      </button>

      {/* Faixa de folhas (computador/tablet) */}
<<<<<<< HEAD
      <div className="page-nav__strip" role="group" aria-label="Páginas do tópico">
=======
      <div className="page-nav__strip" role="tablist" aria-label="Páginas do tópico">
>>>>>>> origin/main
        {hiddenBefore && <span className="page-nav__more" aria-hidden="true">…</span>}
        {visible.map((p) => {
          const i = siblings.indexOf(p);
          const active = p.id === page.id;
          return (
            <button
              key={p.id}
              type="button"
<<<<<<< HEAD
              aria-current={active ? 'page' : undefined}
=======
              role="tab"
              aria-selected={active}
>>>>>>> origin/main
              className={`page-nav__chip ${active ? 'is-active' : ''}`}
              title={label(p)}
              onClick={() => !active && goTo(p)}
            >
              {i + 1}
              {p.isFavorite && <i className="bi bi-star-fill page-nav__fav" aria-hidden="true" />}
            </button>
          );
        })}
        {hiddenAfter && <span className="page-nav__more" aria-hidden="true">…</span>}
      </div>

      {/* Celular: "2/5" abre a lista */}
      <button
        type="button"
        className="page-nav__count"
        aria-haspopup="listbox"
        aria-expanded={listOpen}
        title="Ver todas as páginas do tópico"
        onClick={() => setListOpen((v) => !v)}
      >
        {index + 1}/{total}
        <i className="bi bi-chevron-down" />
      </button>

      <button type="button" className="page-nav__arrow" aria-label="Próxima página" title="Próxima página (Alt+Shift+→)" disabled={!next} onClick={() => goTo(next)}>
        <i className="bi bi-chevron-right" />
      </button>

      <button type="button" className="page-nav__arrow page-nav__add" aria-label="Nova página neste tópico" title="Nova página neste tópico" onClick={addPage}>
        <i className="bi bi-plus-lg" />
      </button>

      {listOpen && (
        <div className="page-nav__list" role="listbox" aria-label="Páginas do tópico">
          {siblings.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={p.id === page.id}
              className={`page-nav__item ${p.id === page.id ? 'is-active' : ''}`}
              onClick={() => goTo(p)}
            >
              <span className="page-nav__item-num">{i + 1}</span>
              <span className="page-nav__item-text">
                <strong>{p.title || `Página ${p.number}`}</strong>
                <small>{p.date}</small>
              </span>
              {p.isFavorite && <i className="bi bi-star-fill page-nav__fav" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
