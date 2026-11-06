import { useLiveQuery } from 'dexie-react-hooks';
import { CSSProperties, useEffect, useRef } from 'react';
import { db } from '../../db/db';
import { readableOn, subjectColor } from './colors';
import { openTopic } from './navigation';
import { useRenameGestures } from '../rename/useRenameGestures';
import { MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import './TopicTabs.css';

/**
 * Abas dos tópicos da matéria atual, na borda de cima da folha (como as
 * orelhas de uma pasta). A aba do tópico aberto é da cor do papel e se
 * junta à folha; as outras ficam na cor da matéria.
 */
export function TopicTabs({ subjectId, activeTopicId }: { subjectId: string; activeTopicId: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const compact = useMediaQuery(MOBILE_QUERY);

  const topics = useLiveQuery(
    async () => (await db.topics.where('subjectId').equals(subjectId).toArray()).sort((a, b) => a.createdAt - b.createdAt),
    [subjectId],
  );

  // Mantém a aba ativa à vista quando há muitos tópicos.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeTopicId, topics?.length]);

  const color = subjectColor(subjectId);
  const style = { '--tab': color, '--tab-fg': readableOn(color) } as CSSProperties;

  // Celular: com um tópico só a faixa não ajuda em nada e custa 44px de altura da folha.
  if (!topics || topics.length === 0 || (compact && topics.length < 2)) return null;

  return (
    <div className="topic-tabs" style={style} ref={listRef} role="tablist" aria-label="Tópicos">
      {topics.map((t) => (
        <TopicTab key={t.id} id={t.id} name={t.name} active={t.id === activeTopicId} />
      ))}
    </div>
  );
}

/** Uma aba de tópico. Duplo clique, botão direito ou segurar o dedo = renomear. */
function TopicTab({ id, name, active }: { id: string; name: string; active: boolean }) {
  const gestures = useRenameGestures({ kind: 'topic', id });
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-current={active ? 'page' : undefined}
      className={`topic-tab ${active ? 'is-active' : ''}`}
      title={`${name} (duplo clique ou segurar para renomear)`}
      onClick={() => !active && openTopic(id)}
      {...gestures}
    >
      <span>{name}</span>
    </button>
  );
}
