export interface Subject {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/** Estilo da folha: pautada (padrão), branca ou quadriculada. */
export type PaperStyle = 'ruled' | 'blank' | 'grid';

export interface Page {
  id: string;
  number: number;
  subjectId: string;
  topicId: string;
  title: string;
  date: string; // dd/mm/aaaa
  content: string; // HTML legado do antigo modo Escrever (ver src/utils/legacyContent.ts) — nunca apagado automaticamente
  contentMigrated?: boolean; // true depois que `content` foi convertido para elemento de texto do Excalidraw
  excalidrawData: string | null; // JSON serializado (elements + appState + files)
  isFavorite: boolean;
  paperStyle?: PaperStyle; // ausente em páginas antigas => tratada como 'ruled'
  createdAt: number;
  updatedAt: number;
}

export interface SearchResult {
  page: Page;
  subjectName: string;
  topicName: string;
  matchedIn: 'title' | 'content' | 'subject' | 'topic' | 'number';
}
