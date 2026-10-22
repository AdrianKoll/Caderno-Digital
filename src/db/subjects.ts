import { db } from './db';
import { generateId } from '../utils/id';
import { Subject } from '../types';
import { NAME_MAX, normalizeName, sameName } from '../utils/names';

export async function createSubject(name: string): Promise<Subject> {
  const now = Date.now();
  const subject: Subject = { id: generateId(), name: name.trim(), createdAt: now, updatedAt: now };
  await db.subjects.add(subject);
  return subject;
}

/** Já existe outra matéria com esse nome? (sem diferenciar maiúsculas nem acentos) */
export async function subjectNameTaken(name: string, exceptId?: string): Promise<boolean> {
  const all = await db.subjects.toArray();
  return all.some((s) => s.id !== exceptId && sameName(s.name, name));
}

export async function renameSubject(id: string, name: string): Promise<void> {
  const clean = normalizeName(name).slice(0, NAME_MAX);
  if (!clean) return;
  await db.subjects.update(id, { name: clean, updatedAt: Date.now() });
}

export async function deleteSubject(id: string): Promise<void> {
  await db.transaction('rw', db.subjects, db.topics, db.pages, async () => {
    const topics = await db.topics.where('subjectId').equals(id).toArray();
    const topicIds = topics.map((t) => t.id);
    if (topicIds.length) {
      await db.pages.where('topicId').anyOf(topicIds).delete();
      await db.topics.where('subjectId').equals(id).delete();
    }
    await db.subjects.delete(id);
  });
}
