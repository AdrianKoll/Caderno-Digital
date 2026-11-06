import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { db } from '../../db/db';
import { createPage, deletePage } from '../../db/pages';
import { Page } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';
import './PageMenu.css';

/**
 * Menu "⋯" no canto da folha (só no celular, ver PageMenu.css): trocar de página
 * (anterior / próxima / lista do tópico), criar uma folha nova e renomear o
 * tópico ou a matéria. No computador essas ações ficam na barra superior.
 */
export function PageMenu({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectPage = useNotebookStore((s) => s.selectPage);
  const openRename = useNotebookStore((s) => s.openRename);
  const setView = useNotebookStore((s) => s.setView);

  const siblings = useLiveQuery(async () => {
    const pages = (await db.pages.where('topicId').equals(page.topicId).sortBy('number').then((rows) => rows.filter((p) => !p.deletedAt))).filter((p) => !p.deletedAt);
    return pages.map((p) => ({
      id: p.id,
      number: p.number,
      subjectId: p.subjectId,
      topicId: p.topicId,
      title: p.title,
      date: p.date,
      isFavorite: p.isFavorite,
    }));
  }, [page.topicId]);

  // Fecha ao tocar fora ou com Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const list = siblings ?? [];
  const index = list.findIndex((p) => p.id === page.id);
  const prev = index > 0 ? list[index - 1] : null;
  const next = index >= 0 && index < list.length - 1 ? list[index + 1] : null;

  const go = (p: (typeof list)[number] | null) => {
    if (!p) return;
    selectPage(p.subjectId, p.topicId, p.id);
    setOpen(false);
  };

  async function addPage() {
    setOpen(false);
    const created = await createPage(page.subjectId, page.topicId);
    selectPage(created.subjectId, created.topicId, created.id);
  }

  return (
    <div className="page-menu" ref={rootRef}>
      <button
        type="button"
        className="page-menu__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Mais opções da página"
        title="Mais opções"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="bi bi-three-dots" />
      </button>

      {open && (
        <div className="page-menu__panel" role="menu">
          <div className="page-menu__pager">
            <button type="button" className="page-menu__step" aria-label="Página anterior" disabled={!prev} onClick={() => go(prev)}>
              <i className="bi bi-chevron-left" />
            </button>
            <span className="page-menu__count">
              Página {index >= 0 ? index + 1 : 1} de {list.length || 1}
            </span>
            <button type="button" className="page-menu__step" aria-label="Próxima página" disabled={!next} onClick={() => go(next)}>
              <i className="bi bi-chevron-right" />
            </button>
          </div>

          {list.length > 1 && (
            <div className="page-menu__list" role="group" aria-label="Páginas do tópico">
              {list.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className={`page-menu__chip ${p.id === page.id ? 'is-active' : ''}`}
                  aria-current={p.id === page.id ? 'page' : undefined}
                  title={`${p.title || `Página ${p.number}`} · ${p.date}`}
                  onClick={() => (p.id === page.id ? setOpen(false) : go(p))}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          <button type="button" role="menuitem" className="page-menu__item" onClick={addPage}>
            <i className="bi bi-plus-lg" />
            <span>Nova página neste tópico</span>
          </button>
          <button type="button" role="menuitem" className="page-menu__item" onClick={() => {
            if (!confirm(`Mover a Página ${page.number} para a lixeira?`)) return;
            void deletePage(page.id).then(() => { setOpen(false); setView('all'); });
          }}>
            <i className="bi bi-trash3" />
            <span>Mover para a lixeira</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="page-menu__item"
            onClick={() => {
              setOpen(false);
              openRename({ kind: 'topic', id: page.topicId });
            }}
          >
            <i className="bi bi-pencil" />
            <span>Renomear tópico</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="page-menu__item"
            onClick={() => {
              setOpen(false);
              openRename({ kind: 'subject', id: page.subjectId });
            }}
          >
            <i className="bi bi-folder2" />
            <span>Renomear matéria</span>
          </button>
        </div>
      )}
    </div>
  );
}
