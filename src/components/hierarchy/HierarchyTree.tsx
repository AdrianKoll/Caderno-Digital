import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { SubjectNode } from './SubjectNode';
import './HierarchyTree.css';

export function HierarchyTree() {
  const subjects = useLiveQuery(() => db.subjects.orderBy('name').toArray(), []);

  if (!subjects) return null;

  return (
    <div>
      {subjects.map((s) => (
        <SubjectNode key={s.id} subject={s} />
      ))}
      {subjects.length === 0 && (
        <p className="tree-empty">Crie sua primeira matéria com o botão "+" acima.</p>
      )}
    </div>
  );
}
