import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Subject } from '../../types';
import { TopicNode } from './TopicNode';
import { createTopic, topicNameTaken } from '../../db/topics';
import { renameSubject, deleteSubject, subjectNameTaken } from '../../db/subjects';
import { InlineName } from '../rename/InlineName';
import { NAME_MAX } from '../../utils/names';

export function SubjectNode({ subject }: { subject: Subject }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [topicError, setTopicError] = useState<string | null>(null);
  const creatingTopic = useRef(false);
  const topicsId = `subject-topics-${subject.id}`;

  const topics = useLiveQuery(
    () => db.topics.where('subjectId').equals(subject.id).sortBy('name'),
    [subject.id],
  );

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Excluir permanentemente a matéria "${subject.name}" e todas as suas páginas? Essa ação não usa a lixeira. Faça um backup antes de continuar.`)) {
      await deleteSubject(subject.id);
    }
  }

  async function commitNewTopic() {
    if (creatingTopic.current) return;
    const name = newTopicName.trim();
    if (!name) {
      setAddingTopic(false);
      return;
    }
    creatingTopic.current = true;
    try {
      if (await topicNameTaken(subject.id, name)) {
        setTopicError('Já existe um tópico com esse nome nesta matéria.');
        return;
      }
      await createTopic(subject.id, name);
      setTopicError(null);
      setExpanded(true);
      setAddingTopic(false);
      setNewTopicName('');
    } catch (error) {
      setTopicError(error instanceof Error ? error.message : 'Não foi possível criar o tópico.');
    } finally {
      creatingTopic.current = false;
    }
  }

  return (
    <div className="tree-subject">
      <div className="tree-row tree-row--subject">
        {editing ? (
          <InlineName
            initial={subject.name}
            placeholder="Nome da matéria"
            maxLength={NAME_MAX}
            validate={async (n) => ((await subjectNameTaken(n, subject.id)) ? 'Já existe uma matéria com esse nome.' : null)}
            onCommit={async (n) => {
              await renameSubject(subject.id, n);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button type="button" className="tree-row__toggle" aria-expanded={expanded} aria-controls={topicsId}
            onClick={() => setExpanded((v) => !v)}>
            <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'} tree-row__chevron`} aria-hidden="true" />
            <i className={`bi ${expanded ? 'bi-folder2-open' : 'bi-folder-fill'} tree-row__icon tree-row__icon--subject`} aria-hidden="true" />
            <span className="tree-row__label" title="Duplo clique para renomear" onDoubleClick={() => setEditing(true)}>{subject.name}</span>
          </button>
        )}
        <span className="tree-row__actions">
          <button
            title="Renomear matéria"
            aria-label="Renomear matéria"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            <i className="bi bi-pencil" />
          </button>
          <button
            title="Novo tópico"
            aria-label="Novo tópico"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
              setAddingTopic(true);
            }}
          >
            <i className="bi bi-folder-plus" />
          </button>
          <button title="Excluir matéria" aria-label="Excluir matéria" className="is-danger" onClick={handleDelete}>
            <i className="bi bi-trash3" />
          </button>
        </span>
      </div>
      <div className="tree-children" id={topicsId} hidden={!expanded}>
        {expanded && <>
          {topics?.map((t) => (
            <TopicNode key={t.id} topic={t} />
          ))}
          {addingTopic && (
            <input
              autoFocus
              className="tree-row__input tree-row__input--new"
              placeholder="Nome do tópico"
              aria-label={`Nome do novo tópico em ${subject.name}`}
              value={newTopicName}
              onChange={(e) => { setNewTopicName(e.target.value); setTopicError(null); }}
              onBlur={commitNewTopic}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); void commitNewTopic(); }
                if (e.key === 'Escape') { e.preventDefault(); setAddingTopic(false); setNewTopicName(''); }
              }}
            />
          )}
          {addingTopic && topicError && <p className="inline-name__error" role="alert">{topicError}</p>}
        </>}
      </div>
    </div>
  );
}
