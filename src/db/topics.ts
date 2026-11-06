import { db } from './db';
import { generateId } from '../utils/id';
import { Topic } from '../types';
import { NAME_MAX, normalizeName, sameName } from '../utils/names';

export async function createTopic(subjectId: string, name: string): Promise<Topic> {
  const clean = normalizeName(name).slice(0, NAME_MAX);
  if (!clean) throw new Error('Escreva um nome para o tópico.');
  const now = Date.now();
  const topic: Topic = { id: generateId(), subjectId, name: clean, createdAt: now, updatedAt: now };
  return db.transaction('rw', db.topics, async () => {
    const siblings = await db.topics.where('subjectId').equals(subjectId).toArray();
    if (siblings.some((existing) => sameName(existing.name, clean))) {
      throw new Error('Já existe um tópico com esse nome nesta matéria.');
    }
    await db.topics.add(topic);
    return topic;
  });
}

/** Já existe outro tópico com esse nome dentro da mesma matéria? */
export async function topicNameTaken(subjectId: string, name: string, exceptId?: string): Promise<boolean> {
  const all = await db.topics.where('subjectId').equals(subjectId).toArray();
  return all.some((t) => t.id !== exceptId && sameName(t.name, name));
}

export async function renameTopic(id: string, name: string): Promise<void> {
  const clean = normalizeName(name).slice(0, NAME_MAX);
  if (!clean) return;
  await db.topics.update(id, { name: clean, updatedAt: Date.now() });
}

export async function deleteTopic(id: string): Promise<void> {
  await db.transaction('rw', db.topics, db.pages, async () => {
    await db.pages.where('topicId').equals(id).delete();
    await db.topics.delete(id);
  });
}
