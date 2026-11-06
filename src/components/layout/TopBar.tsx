import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { PageNavigator } from '../notebook/PageNavigator';
import { useNotebookStore } from '../../store/notebookStore';
import { exportPage, ExportKind } from '../../utils/exportPage';
import { useTheme } from '../../hooks/useTheme';
import './TopBar.css';

const EXPORT_OPTIONS: { kind: ExportKind; label: string; hint: string; icon: string }[] = [
  { kind: 'print', label: 'Imprimir', hint: 'Abre a impressão (A4)', icon: 'bi-printer' },
  { kind: 'pdf', label: 'PDF', hint: 'Arquivo .pdf em A4', icon: 'bi-file-earmark-pdf' },
  { kind: 'png', label: 'Imagem', hint: 'Arquivo .png em alta resolução', icon: 'bi-file-earmark-image' },
];

/** "Página 3 · Python · django" -> "Pagina-3_Python_django" (seguro para nome de arquivo). */
function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function TopBar({ sidebarOpen, onToggleSidebar }: { sidebarOpen: boolean; onToggleSidebar: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();
  const exportRef = useRef<HTMLDivElement>(null);
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const view = useNotebookStore((s) => s.view);
  const setToolbarSlot = useNotebookStore((s) => s.setToolbarSlot);
  const setFocusMode = useNotebookStore((s) => s.setFocusMode);
  const currentPage = useLiveQuery(
    () => (selectedPageId ? db.pages.get(selectedPageId) : undefined),
    [selectedPageId],
  );
  const subject = useLiveQuery(
    () => (currentPage ? db.subjects.get(currentPage.subjectId) : undefined),
    [currentPage?.subjectId],
  );
  const topic = useLiveQuery(
    () => (currentPage ? db.topics.get(currentPage.topicId) : undefined),
    [currentPage?.topicId],
  );

  const showPageTools = view === 'notebook' && !!currentPage;

  // Fecha o menu ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  async function handleExport(kind: ExportKind) {
    if (!currentPage) return;
    setMenuOpen(false);
    setBusy(true);
    const filename = ['Pagina', currentPage.number, slug(subject?.name ?? ''), slug(topic?.name ?? '')]
      .filter((part) => part !== '')
      .join('_');
    try {
      await exportPage(kind, filename);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Não foi possível salvar a página.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__menu-btn"
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-controls="caderno-sidebar"
          aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <img className="topbar__site-icon" src="/icons/brand-256.png" alt="" aria-hidden="true" />
        </button>

        {showPageTools && (
          <div className="topbar__crumb" title={`${subject?.name ?? ''} › ${topic?.name ?? ''}`}>
            <i className="bi bi-folder2-open" />
            <span>{subject?.name ?? '—'}</span>
            <i className="bi bi-chevron-right topbar__crumb-sep" />
            <span>{topic?.name ?? '—'}</span>
          </div>
        )}
      </div>

      {/* Centro da barra: a barra de ferramentas do desenho é encaixada aqui
          (portal feito pelo ExcalidrawLayer; ver DrawToolbar.css). */}
      {showPageTools && <div className="topbar__tools" ref={setToolbarSlot} />}

      <div className="topbar__right">
        {showPageTools && currentPage && <PageNavigator page={currentPage} />}

        {/* Só no celular (CSS): esconde a barra e as abas para sobrar mais folha. */}
        {showPageTools && (
          <>
            <button
              type="button"
              className="topbar__focus-btn"
              onClick={() => setFocusMode(true)}
              aria-label="Modo escrita (tela cheia)"
              title="Modo escrita"
            >
              <i className="bi bi-fullscreen" />
            </button>

            {/* Só no celular (CSS): divisória entre os botões de tela cheia e de tema. */}
            <span className="topbar__sep" aria-hidden="true" />
          </>
        )}

        <button
          type="button"
          className="topbar__theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        >
          <i className={`bi ${theme === 'dark' ? 'bi-moon' : 'bi-sun'}`} />
        </button>

        {showPageTools && (
        <div className="topbar__export" ref={exportRef}>
          <button
            type="button"
            className="topbar__export-btn"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Salvar como"
            title="Salvar como"
            disabled={busy}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <i className={`bi ${busy ? 'bi-hourglass-split' : 'bi-download'}`} />
            <span className="topbar__export-label">{busy ? 'Gerando...' : 'Salvar como'}</span>
            <i className="bi bi-chevron-down topbar__export-caret" />
          </button>

          {menuOpen && (
            <div className="topbar__export-menu" role="menu">
              {EXPORT_OPTIONS.map((o) => (
                <button
                  key={o.kind}
                  type="button"
                  role="menuitem"
                  className="topbar__export-item"
                  onClick={() => handleExport(o.kind)}
                >
                  <i className={`bi ${o.icon}`} />
                  <span>
                    <strong>{o.label}</strong>
                    <small>{o.hint}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
