import { db } from './db';
import { Page, Subject, Topic } from '../types';

const FORMAT = 'caderno-digital-backup';
const VERSION = 1;
interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  subjects: Subject[];
  topics: Topic[];
  pages: Page[];
  meta: { key: string; value: number }[];
}

export async function createBackup(): Promise<BackupFile> {
  const [subjects, topics, pages, meta] = await db.transaction(
    'r', db.subjects, db.topics, db.pages, db.meta,
    () => Promise.all([db.subjects.toArray(), db.topics.toArray(), db.pages.toArray(), db.meta.toArray()]),
  );
  return { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), subjects, topics, pages, meta };
}

export async function downloadBackup(): Promise<void> {
  const backup = await createBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `caderno-digital-backup-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
// Espelha MarkerKind e o limite do modelo persistido, sem acoplar db/ à interface.
const MAX_RICH_INDENT = 4;
const validMarkers = new Set<string>([
  'none', 'dot', 'circle', 'square', 'diamond', 'arrow', 'check', 'star', 'dash', 'box',
  'num-dot', 'num-paren', 'alpha-lower', 'alpha-upper', 'roman-lower', 'roman-upper',
]);
const validColor = (value: unknown): value is string => typeof value === 'string' && /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value);

function validRichDoc(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.paras) || !validColor(value.color) ||
      !Number.isFinite(value.fontFamily) || !Number.isFinite(value.fontSize) ||
      !Number.isFinite(value.lineHeight) || !['left', 'center', 'right'].includes(String(value.align)) ||
      !Number.isFinite(value.width) || typeof value.fixedWidth !== 'boolean') return false;
  return value.paras.every((para) => isRecord(para) && Array.isArray(para.runs) &&
    validMarkers.has(String(para.marker)) && Number.isInteger(para.indent) && Number(para.indent) >= 0 && Number(para.indent) <= MAX_RICH_INDENT &&
    para.runs.every((run) => isRecord(run) && typeof run.text === 'string' &&
      (run.color === undefined || validColor(run.color)) &&
      (run.bold === undefined || typeof run.bold === 'boolean') &&
      (run.italic === undefined || typeof run.italic === 'boolean') &&
      (run.underline === undefined || typeof run.underline === 'boolean')));
}

function validScene(value: unknown): boolean {
  if (typeof value !== 'string') return value === null;
  try {
    const scene: unknown = JSON.parse(value);
    if (!isRecord(scene) || !Array.isArray(scene.elements)) return false;
    return scene.elements.every((element) => {
      if (!isRecord(element)) return false;
      const customData = element.customData;
      return customData === undefined || (isRecord(customData) &&
        (customData.rich === undefined || validRichDoc(customData.rich)));
    });
  } catch {
    return false;
  }
}

function validSubjects(value: unknown): value is Subject[] {
  return Array.isArray(value) && value.every((r) => isRecord(r) && typeof r.id === 'string' && !!r.id && typeof r.name === 'string' && typeof r.createdAt === 'number' && typeof r.updatedAt === 'number');
}
function validTopics(value: unknown): value is Topic[] {
  return Array.isArray(value) && value.every((r) => isRecord(r) && typeof r.id === 'string' && !!r.id && typeof r.subjectId === 'string' && typeof r.name === 'string' && typeof r.createdAt === 'number' && typeof r.updatedAt === 'number');
}
function validPages(value: unknown): value is Page[] {
  return Array.isArray(value) && value.every((r) => isRecord(r) && typeof r.id === 'string' && !!r.id && typeof r.number === 'number' && Number.isInteger(r.number) && r.number >= 0 && typeof r.subjectId === 'string' && typeof r.topicId === 'string' && typeof r.title === 'string' && typeof r.date === 'string' && typeof r.content === 'string' && (typeof r.excalidrawData === 'string' || r.excalidrawData === null) && validScene(r.excalidrawData) && typeof r.isFavorite === 'boolean' && typeof r.createdAt === 'number' && typeof r.updatedAt === 'number' && (r.paperLineSpacing === undefined || (typeof r.paperLineSpacing === 'number' && Number.isInteger(r.paperLineSpacing) && r.paperLineSpacing >= 18 && r.paperLineSpacing <= 60 && r.paperLineSpacing % 2 === 0)));
}

export async function restoreBackupFile(file: File): Promise<{ subjects: number; topics: number; pages: number }> {
  if (file.size > 100 * 1024 * 1024) throw new Error('O arquivo excede o limite de 100 MB.');
  let data: unknown;
  try { data = JSON.parse(await file.text()); }
  catch { throw new Error('O arquivo não contém JSON válido.'); }
  if (!isRecord(data) || data.format !== FORMAT || data.version !== VERSION ||
      !validSubjects(data.subjects) || !validTopics(data.topics) || !validPages(data.pages) ||
      !Array.isArray(data.meta) || !data.meta.every((row) => isRecord(row) && typeof row.key === 'string' && typeof row.value === 'number')) {
    throw new Error('Este arquivo não é um backup válido do Caderno Digital. Os dados atuais foram mantidos.');
  }
  const subjects = data.subjects as Subject[];
  const topics = data.topics as Topic[];
  const pages = data.pages as Page[];
  const meta = data.meta as { key: string; value: number }[];
  // Todas as validações são anteriores à transação: nenhum dado é substituído se o arquivo for incompatível.
  const subjectIds = new Set(subjects.map((s) => s.id));
  const topicIds = new Set(topics.map((t) => t.id));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const pageNumbers = new Set(pages.map((p) => p.number));
  if (subjectIds.size !== subjects.length || topicIds.size !== topics.length || pageNumbers.size !== pages.length ||
      new Set(pages.map((p) => p.id)).size !== pages.length || new Set(meta.map((row) => row.key)).size !== meta.length ||
      meta.some((row) => !Number.isFinite(row.value)) ||
      topics.some((t) => !subjectIds.has(t.subjectId)) ||
      pages.some((p) => !subjectIds.has(p.subjectId) || !topicIds.has(p.topicId) || topicById.get(p.topicId)?.subjectId !== p.subjectId)) {
    throw new Error('O backup contém páginas ou tópicos sem sua estrutura correspondente. Os dados atuais foram mantidos.');
  }
  const pageCounter = meta.find((row) => row.key === 'pageCounter');
  const maxPageNumber = pages.reduce((max, page) => Math.max(max, page.number), -1);
  if (pageCounter && (!Number.isInteger(pageCounter.value) || pageCounter.value < maxPageNumber)) {
    pageCounter.value = maxPageNumber;
  } else if (!pageCounter && maxPageNumber >= 0) {
    meta.push({ key: 'pageCounter', value: maxPageNumber });
  }
  await db.transaction('rw', db.subjects, db.topics, db.pages, db.meta, async () => {
    await Promise.all([db.pages.clear(), db.topics.clear(), db.subjects.clear(), db.meta.clear()]);
    await Promise.all([db.subjects.bulkPut(subjects), db.topics.bulkPut(topics), db.pages.bulkPut(pages), db.meta.bulkPut(meta)]);
  });
  return { subjects: subjects.length, topics: topics.length, pages: pages.length };
}
