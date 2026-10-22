import { create } from 'zustand';
import { DEFAULT_FILTERS, DEFAULT_SORT, PageFilters, PageSort } from '../utils/pageFilters';

/** O que está sendo renomeado na janela de renomear (ver components/rename). */
export type RenameTarget = { kind: 'subject' | 'topic' | 'page'; id: string };

interface NotebookState {
  selectedSubjectId: string | null;
  selectedTopicId: string | null;
  selectedPageId: string | null;
  searchQuery: string;
  view: 'notebook' | 'favorites' | 'trash' | 'all';
  /** Últimas cores personalizadas usadas (contorno OU preenchimento), mais
   *  recente primeiro. Compartilhada entre as duas paletas do painel de
   *  propriedades (ver ElementContextPanel.tsx). Só em memória — não
   *  precisa sobreviver a um reload para cumprir seu papel de atalho. */
  recentColors: string[];

  /** Última página aberta em cada matéria / tópico (as divisórias do fichário voltam para ela). Só em memória. */
  lastPageBySubject: Record<string, string>;
  lastPageByTopic: Record<string, string>;

  /** Filtros e ordem da lista de páginas ("Todas" / "Favoritos"). Ficam guardados ao abrir uma página e voltar. */
  listFilters: PageFilters;
  listSort: PageSort;
  setListFilters: (patch: Partial<PageFilters>) => void;
  setListSort: (sort: PageSort) => void;
  resetListFilters: () => void;

  /** Janela de renomear aberta (uma só para o app inteiro). */
  renameTarget: RenameTarget | null;
  openRename: (target: RenameTarget) => void;
  closeRename: () => void;

  /** Janela "Sobre e créditos" (Excalidraw e demais bibliotecas). */
  aboutOpen: boolean;
  openAbout: () => void;
  closeAbout: () => void;

  /** Espaço no centro da TopBar onde a barra de ferramentas do desenho é encaixada (portal). */
  toolbarSlot: HTMLElement | null;

  selectPage: (subjectId: string, topicId: string, pageId: string) => void;
  setSearchQuery: (q: string) => void;
  setView: (v: NotebookState['view']) => void;
  addRecentColor: (color: string) => void;
  setToolbarSlot: (el: HTMLElement | null) => void;
}

const MAX_RECENT_COLORS = 8;

export const useNotebookStore = create<NotebookState>((set) => ({
  selectedSubjectId: null,
  selectedTopicId: null,
  selectedPageId: null,
  searchQuery: '',
  view: 'notebook',
  recentColors: [],
  toolbarSlot: null,
  lastPageBySubject: {},
  lastPageByTopic: {},
  listFilters: DEFAULT_FILTERS,
  listSort: DEFAULT_SORT,
  renameTarget: null,
  aboutOpen: false,

  selectPage: (subjectId, topicId, pageId) =>
    set((s) => ({
      selectedSubjectId: subjectId,
      selectedTopicId: topicId,
      selectedPageId: pageId,
      view: 'notebook',
      lastPageBySubject: { ...s.lastPageBySubject, [subjectId]: pageId },
      lastPageByTopic: { ...s.lastPageByTopic, [topicId]: pageId },
    })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setView: (view) => set({ view }),
  addRecentColor: (color) =>
    set((s) => ({
      recentColors: [color, ...s.recentColors.filter((c) => c !== color)].slice(0, MAX_RECENT_COLORS),
    })),
  setToolbarSlot: (toolbarSlot) => set({ toolbarSlot }),
  setListFilters: (patch) => set((s) => ({ listFilters: { ...s.listFilters, ...patch } })),
  setListSort: (listSort) => set({ listSort }),
  resetListFilters: () => set({ listFilters: DEFAULT_FILTERS }),
  openRename: (renameTarget) => set({ renameTarget }),
  closeRename: () => set({ renameTarget: null }),
  openAbout: () => set({ aboutOpen: true }),
  closeAbout: () => set({ aboutOpen: false }),
}));
