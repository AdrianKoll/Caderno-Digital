import { db, nextPageNumber } from './db';
import { generateId } from '../utils/id';
import { todayLabel } from '../utils/date';
import { Page, PaperStyle } from '../types';
import { TITLE_MAX, normalizeName } from '../utils/names';

export async function createPage(subjectId: string, topicId: string): Promise<Page> {
  const number = await nextPageNumber();
  const now = Date.now();
  const page: Page = {
    id: generateId(),
    number,
    subjectId,
    topicId,
    title: '',
    date: todayLabel(),
    content: '',
    excalidrawData: null,
    isFavorite: false,
    paperStyle: 'ruled',
    createdAt: now,
    updatedAt: now,
  };
  await db.pages.add(page);
  return page;
}

export async function updatePage(id: string, changes: Partial<Page>): Promise<void> {
  await db.pages.update(id, { ...changes, updatedAt: Date.now() });
}

/** Renomeia a página. Título vazio é permitido: a página volta a aparecer só como "Página N". */
export async function renamePage(id: string, title: string): Promise<void> {
  await db.pages.update(id, { title: normalizeName(title).slice(0, TITLE_MAX), updatedAt: Date.now() });
}

export async function deletePage(id: string): Promise<void> {
  await db.pages.delete(id);
}

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.pages.update(id, { isFavorite, updatedAt: Date.now() });
}

export async function setPaperStyle(id: string, paperStyle: PaperStyle): Promise<void> {
  await db.pages.update(id, { paperStyle, updatedAt: Date.now() });
}

export async function movePage(id: string, subjectId: string, topicId: string): Promise<void> {
  await db.pages.update(id, { subjectId, topicId, updatedAt: Date.now() });
}
