import { useState } from 'react';
import { Page } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';
<<<<<<< HEAD
import { deletePage, renamePage } from '../../db/pages';
=======
import { renamePage } from '../../db/pages';
>>>>>>> origin/main
import { InlineName } from '../rename/InlineName';
import { TITLE_MAX } from '../../utils/names';

export function PageNode({ page }: { page: Page }) {
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const selectPage = useNotebookStore((s) => s.selectPage);
  const isActive = selectedPageId === page.id;
  const [editing, setEditing] = useState(false);

  // Editando: a linha vira <div> (um <input> dentro de <button> não recebe espaço/seleção direito em alguns navegadores).
  if (editing) {
    return (
      <div className={`tree-page ${isActive ? 'is-active' : ''}`}>
        <div className="tree-page__main">
          <i className="bi bi-file-earmark-text tree-page__icon" />
          <span className="tree-page__prefix">Página {page.number} ·</span>
          <InlineName
            initial={page.title}
            placeholder="Título da página"
            maxLength={TITLE_MAX}
            allowEmpty
            onCommit={async (title) => {
              await renamePage(page.id, title);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`tree-page ${isActive ? 'is-active' : ''}`}>
      <button
        type="button"
        className="tree-page__main"
        onClick={() => selectPage(page.subjectId, page.topicId, page.id)}
        title={page.title ? `${page.title} — duplo clique para renomear` : `Página ${page.number} — duplo clique para dar um título`}
        onDoubleClick={() => setEditing(true)}
      >
        <i className={`bi ${isActive ? 'bi-file-earmark-text-fill' : 'bi-file-earmark-text'} tree-page__icon`} />
        <span className="tree-page__label">
          Página {page.number}
          {page.title ? ` · ${page.title}` : ''}
        </span>
        {page.isFavorite && <i className="bi bi-star-fill tree-page__fav" />}
      </button>
      <span className="tree-row__actions">
        <button title="Renomear página" aria-label="Renomear página" onClick={() => setEditing(true)}>
          <i className="bi bi-pencil" />
        </button>
<<<<<<< HEAD
        <button title="Mover página para a lixeira" aria-label={`Mover Página ${page.number} para a lixeira`} onClick={async () => {
          if (confirm(`Mover a Página ${page.number} para a lixeira?`)) await deletePage(page.id);
        }}>
          <i className="bi bi-trash3" />
        </button>
=======
>>>>>>> origin/main
      </span>
    </div>
  );
}
