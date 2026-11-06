import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { useNotebookStore } from '../../store/notebookStore';

/**
 * Voltar / avançar de página, acoplados à doca de ferramentas (celular). Usam
 * o mesmo critério do PageNavigator da barra superior: as folhas do mesmo
 * tópico, em ordem de número.
 */
export function DockPageButtons() {
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const selectPage = useNotebookStore((s) => s.selectPage);

  const nav = useLiveQuery(async () => {
    if (!selectedPageId) return null;
    const page = await db.pages.get(selectedPageId);
    if (!page) return null;
    const pages = await db.pages.where('topicId').equals(page.topicId).sortBy('number').then((rows) => rows.filter((p) => !p.deletedAt));
    const i = pages.findIndex((p) => p.id === page.id);
    return {
      prev: i > 0 ? pages[i - 1] : null,
      next: i >= 0 && i < pages.length - 1 ? pages[i + 1] : null,
    };
  }, [selectedPageId]);

  const prev = nav?.prev ?? null;
  const next = nav?.next ?? null;

  return (
    <>
      <button
        type="button"
        title="Página anterior"
        aria-label="Página anterior"
        className="draw-toolbar__btn draw-toolbar__btn--page"
        disabled={!prev}
        onClick={() => prev && selectPage(prev.subjectId, prev.topicId, prev.id)}
      >
        <i className="bi bi-chevron-left" />
      </button>
      <button
        type="button"
        title="Próxima página"
        aria-label="Próxima página"
        className="draw-toolbar__btn draw-toolbar__btn--page"
        disabled={!next}
        onClick={() => next && selectPage(next.subjectId, next.topicId, next.id)}
      >
        <i className="bi bi-chevron-right" />
      </button>
    </>
  );
}
