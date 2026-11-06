import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Topic } from '../../types';
import { PageNode } from './PageNode';
import { createPage } from '../../db/pages';
import { renameTopic, deleteTopic, topicNameTaken } from '../../db/topics';
import { InlineName } from '../rename/InlineName';
import { NAME_MAX } from '../../utils/names';
import { useNotebookStore } from '../../store/notebookStore';

export function TopicNode({ topic }: { topic: Topic }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const selectPage = useNotebookStore((s) => s.selectPage);
  const pagesId = `topic-pages-${topic.id}`;

  const pages = useLiveQuery(
    async () => (await db.pages.where('topicId').equals(topic.id).sortBy('number')).filter((page) => !page.deletedAt),
    [topic.id],
  );

  async function handleAddPage(e: React.MouseEvent) {
    e.stopPropagation();
    const page = await createPage(topic.subjectId, topic.id);
    setExpanded(true);
    selectPage(topic.subjectId, topic.id, page.id);
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Excluir permanentemente o tópico "${topic.name}" e todas as suas páginas? Essa ação não usa a lixeira. Faça um backup antes de continuar.`)) {
      await deleteTopic(topic.id);
    }
  }

  return (
    <div className="tree-topic">
      <div className="tree-row">
        {editing ? (
          <InlineName
            initial={topic.name}
            placeholder="Nome do tópico"
            maxLength={NAME_MAX}
            validate={async (n) =>
              (await topicNameTaken(topic.subjectId, n, topic.id)) ? 'Já existe um tópico com esse nome nesta matéria.' : null
            }
            onCommit={async (n) => {
              await renameTopic(topic.id, n);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button type="button" className="tree-row__toggle" aria-expanded={expanded} aria-controls={pagesId}
            onClick={() => setExpanded((v) => !v)}>
            <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'} tree-row__chevron`} aria-hidden="true" />
            <i className="bi bi-journal-text tree-row__icon" aria-hidden="true" />
            <span className="tree-row__label" title="Duplo clique para renomear" onDoubleClick={() => setEditing(true)}>{topic.name}</span>
          </button>
        )}
        {pages && pages.length > 0 && <span className="tree-row__count">{pages.length}</span>}
        <span className="tree-row__actions">
          <button
            title="Renomear tópico"
            aria-label="Renomear tópico"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            <i className="bi bi-pencil" />
          </button>
          <button title="Nova página" aria-label="Nova página" onClick={handleAddPage}>
            <i className="bi bi-file-earmark-plus" />
          </button>
          <button title="Excluir tópico" aria-label="Excluir tópico" className="is-danger" onClick={handleDelete}>
            <i className="bi bi-trash3" />
          </button>
        </span>
      </div>
      <div className="tree-children" id={pagesId} hidden={!expanded}>
        {expanded && <>
          {pages?.map((p) => (
            <PageNode key={p.id} page={p} />
          ))}
          {pages?.length === 0 && <p className="tree-empty">Nenhuma página ainda.</p>}
        </>}
      </div>
    </div>
  );
}
