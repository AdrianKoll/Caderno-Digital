import Dexie, { Table } from 'dexie';
import { Page, Subject, Topic } from '../types';

interface MetaRow {
  key: string;
  value: number;
}

/**
 * Banco local (IndexedDB via Dexie).
 *
 * Estruturado de propósito para ser fácil de trocar depois por uma API REST +
 * PostgreSQL: toda a leitura/escrita passa pelos módulos em src/db/*.ts
 * (subjects.ts, topics.ts, pages.ts). O resto do app nunca importa `db`
 * diretamente — só esses módulos. Trocar a implementação (ex.: chamadas
 * fetch para um backend) significa reescrever só esses arquivos.
 */
class NotebookDB extends Dexie {
  subjects!: Table<Subject, string>;
  topics!: Table<Topic, string>;
  pages!: Table<Page, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('caderno-digital');
    this.version(1).stores({
      subjects: 'id, name',
      topics: 'id, subjectId, name',
      pages: 'id, number, subjectId, topicId, isFavorite, title, date',
      meta: 'key',
    });
  }
}

export const db = new NotebookDB();

/**
 * Contador global e monotônico de números de página. Não reutiliza números
 * de páginas excluídas (regra da especificação, seção 4).
 */
export async function nextPageNumber(): Promise<number> {
  return db.transaction('rw', db.meta, async () => {
    const row = await db.meta.get('pageCounter');
    const next = row ? row.value + 1 : 0;
    await db.meta.put({ key: 'pageCounter', value: next });
    return next;
  });
}
