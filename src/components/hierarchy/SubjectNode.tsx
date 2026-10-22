import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Subject } from '../../types';
import { TopicNode } from './TopicNode';
import { createTopic } from '../../db/topics';
import { renameSubject, deleteSubject, subjectNameTaken } from '../../db/subjects';
import { InlineName } from '../rename/InlineName';
import { NAME_MAX } from '../../utils/names';

export function SubjectNode({ subject }: { subject: Subject }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingTopic, setAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const topics = useLiveQuery(
    () => db.topics.where('subjectId').equals(subject.id).sortBy('name'),
    [subject.id],
  );

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm(`Excluir a matéria "${subject.name}" e todo o seu conteúdo?`)) {
      await deleteSubject(subject.id);
    }
  }

  async function commitNewTopic() {
    if (newTopicName.trim()) {
      await createTopic(subject.id, newTopicName.trim());
      setExpanded(true);
    }
    setAddingTopic(false);
    setNewTopicName('');
  }

  return (
    <div className="tree-subject">
      <div className="tree-row tree-row--subject" onClick={() => setExpanded((v) => !v)}>
        <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'} tree-row__chevron`} />
        <i className={`bi ${expanded ? 'bi-folder2-open' : 'bi-folder-fill'} tree-row__icon tree-row__icon--subject`} />
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
          <span className="tree-row__label" title="Duplo clique para renomear" onDoubleClick={() => setEditing(true)}>
            {subject.name}
          </span>
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
      {expanded && (
        <div className="tree-children">
          {topics?.map((t) => (
            <TopicNode key={t.id} topic={t} />
          ))}
          {addingTopic && (
            <input
              autoFocus
              className="tree-row__input tree-row__input--new"
              placeholder="Nome do tópico"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onBlur={commitNewTopic}
              onKeyDown={(e) => e.key === 'Enter' && commitNewTopic()}
            />
          )}
        </div>
      )}
    </div>
  );
}
