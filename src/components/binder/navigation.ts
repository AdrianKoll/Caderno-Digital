import { db } from '../../db/db';
import { Page } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';

/**
 * Para onde uma divisória leva. Volta para a última página aberta naquela
 * matéria/tópico; se não houver (ou ela foi apagada/movida), vai para a
 * primeira página. `undefined` quando não há nenhuma página.
 */
export async function pageForTopic(topicId: string): Promise<Page | undefined> {
  const last = useNotebookStore.getState().lastPageByTopic[topicId];
  if (last) {
    const p = await db.pages.get(last);
    if (p && !p.deletedAt && p.topicId === topicId) return p;
  }
  const pages = await db.pages.where('topicId').equals(topicId).sortBy('number').then((rows) => rows.filter((p) => !p.deletedAt));
  return pages[0];
}

export async function pageForSubject(subjectId: string): Promise<Page | undefined> {
  const last = useNotebookStore.getState().lastPageBySubject[subjectId];
  if (last) {
    const p = await db.pages.get(last);
    if (p && !p.deletedAt && p.subjectId === subjectId) return p;
  }
  const topics = (await db.topics.where('subjectId').equals(subjectId).toArray()).sort((a, b) => a.createdAt - b.createdAt);
  for (const t of topics) {
    const pages = await db.pages.where('topicId').equals(t.id).sortBy('number').then((rows) => rows.filter((p) => !p.deletedAt));
    if (pages[0]) return pages[0];
  }
  return undefined;
}

export async function openSubject(subjectId: string): Promise<boolean> {
  const page = await pageForSubject(subjectId);
  if (!page) return false;
  useNotebookStore.getState().selectPage(page.subjectId, page.topicId, page.id);
  return true;
}

export async function openTopic(topicId: string): Promise<boolean> {
  const page = await pageForTopic(topicId);
  if (!page) return false;
  useNotebookStore.getState().selectPage(page.subjectId, page.topicId, page.id);
  return true;
}
