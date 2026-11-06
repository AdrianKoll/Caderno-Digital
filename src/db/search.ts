import { db } from './db';
import { SearchResult } from '../types';

/**
 * Busca simples em memória (o volume de dados de um caderno pessoal é
 * pequeno o bastante para não precisar de indexação de texto completo).
 */
export async function searchAll(query: string): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const [subjects, topics, pages] = await Promise.all([
    db.subjects.toArray(),
    db.topics.toArray(),
    db.pages.toArray(),
  ]);

  const subjectById = new Map(subjects.map((s) => [s.id, s]));
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const results: SearchResult[] = [];

  for (const page of pages) {
<<<<<<< HEAD
    if (page.deletedAt) continue;
=======
>>>>>>> origin/main
    const subject = subjectById.get(page.subjectId);
    const topic = topicById.get(page.topicId);
    const subjectName = subject?.name ?? '';
    const topicName = topic?.name ?? '';
    const plainContent = page.content.replace(/<[^>]+>/g, ' ').toLowerCase();

    if (String(page.number).includes(q)) {
      results.push({ page, subjectName, topicName, matchedIn: 'number' });
    } else if (page.title.toLowerCase().includes(q)) {
      results.push({ page, subjectName, topicName, matchedIn: 'title' });
    } else if (subjectName.toLowerCase().includes(q)) {
      results.push({ page, subjectName, topicName, matchedIn: 'subject' });
    } else if (topicName.toLowerCase().includes(q)) {
      results.push({ page, subjectName, topicName, matchedIn: 'topic' });
    } else if (plainContent.includes(q)) {
      results.push({ page, subjectName, topicName, matchedIn: 'content' });
    }
  }

  return results.slice(0, 50);
}
