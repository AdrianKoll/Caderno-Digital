import { useLiveQuery } from 'dexie-react-hooks';
import { CSSProperties } from 'react';
import { db } from '../../db/db';
import { useNotebookStore } from '../../store/notebookStore';
import { readableOn, subjectColor } from './colors';
import { openSubject } from './navigation';
import { useRenameGestures } from '../rename/useRenameGestures';
import './SubjectTabs.css';

type View = 'notebook' | 'favorites' | 'trash' | 'all';

const SHORTCUTS: { view: View; label: string; icon: string; iconActive: string }[] = [
  { view: 'notebook', label: 'Início', icon: 'bi-house-door', iconActive: 'bi-house-door-fill' },
  { view: 'all', label: 'Todas as páginas', icon: 'bi-collection', iconActive: 'bi-collection-fill' },
  { view: 'favorites', label: 'Favoritos', icon: 'bi-star', iconActive: 'bi-star-fill' },
];

/**
 * Divisórias do fichário: uma aba colorida por matéria, na borda direita da
 * folha, e três atalhos no topo (Início, Todas as páginas, Favoritos). Clicar
 * numa matéria volta para a última página aberta nela.
 */
export function SubjectTabs({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const view = useNotebookStore((s) => s.view);
  const setView = useNotebookStore((s) => s.setView);
  const selectedSubjectId = useNotebookStore((s) => s.selectedSubjectId);

  const subjects = useLiveQuery(async () => {
    const list = (await db.subjects.toArray()).sort((a, b) => a.createdAt - b.createdAt);
    const counts = await Promise.all(list.map((s) => db.pages.where('subjectId').equals(s.id).count()));
    return list.map((s, i) => ({ id: s.id, name: s.name, pages: counts[i] }));
  }, []);

  async function go(id: string) {
    const ok = await openSubject(id);
    if (!ok) onOpenMenu?.(); // matéria sem páginas: abre o menu, onde se cria tópico e página
  }

  return (
    <nav className="subject-tabs" aria-label="Divisórias do caderno">
      <div className="subject-tabs__shortcuts">
        {SHORTCUTS.map((s) => {
          const active = view === s.view;
          return (
            <button
              key={s.view}
              type="button"
              className={`subject-tab subject-tab--icon ${active ? 'is-active' : ''}`}
              title={s.label}
              aria-label={s.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => setView(s.view)}
            >
              <i className={`bi ${active ? s.iconActive : s.icon}`} />
            </button>
          );
        })}
      </div>

      <div className="subject-tabs__subjects">
        {(subjects ?? []).map((s) => (
          <SubjectTab
            key={s.id}
            id={s.id}
            name={s.name}
            empty={s.pages === 0}
            active={view === 'notebook' && selectedSubjectId === s.id}
            onOpen={() => go(s.id)}
          />
        ))}
      </div>
    </nav>
  );
}

/** Uma divisória de matéria. Duplo clique, botão direito ou segurar o dedo = renomear. */
function SubjectTab({ id, name, empty, active, onOpen }: { id: string; name: string; empty: boolean; active: boolean; onOpen: () => void }) {
  const gestures = useRenameGestures({ kind: 'subject', id });
  const color = subjectColor(id);
  const style = { '--tab': color, '--tab-fg': readableOn(color) } as CSSProperties;
  return (
    <button
      type="button"
      className={`subject-tab subject-tab--subject ${active ? 'is-active' : ''} ${empty ? 'is-empty' : ''}`}
      style={style}
      title={`${name}${empty ? ' — sem páginas' : ''} (duplo clique ou segurar para renomear)`}
      aria-label={name}
      aria-current={active ? 'page' : undefined}
      onClick={onOpen}
      {...gestures}
    >
      <span className="subject-tab__label">{name}</span>
    </button>
  );
}
