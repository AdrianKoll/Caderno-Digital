import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Sidebar } from './Sidebar';
import { ListView } from './ListView';
import { EmptyState } from './EmptyState';
import { TopBar } from './TopBar';
import { SubjectTabs } from '../binder/SubjectTabs';
import { RenameDialog } from '../rename/RenameDialog';
import { AboutDialog } from '../about/AboutDialog';
import { NotebookPage } from '../notebook/NotebookPage';
import { db } from '../../db/db';
import { useNotebookStore } from '../../store/notebookStore';
import { MOBILE_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';
import { useDrawerGestures } from '../../hooks/useDrawerGestures';
import './AppShell.css';

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const view = useNotebookStore((s) => s.view);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // Gaveta: arrastar da borda abre, arrastar para o lado fecha; Esc também fecha.
  useDrawerGestures(sidebarOpen, setSidebarOpen, isMobile);
  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSidebarOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const page = useLiveQuery(
    () => (selectedPageId ? db.pages.get(selectedPageId) : undefined),
    [selectedPageId],
  );

  return (
    <div className="app-shell">
      <div
        className={`app-shell__sidebar ${sidebarOpen ? 'is-open' : ''}`}
        aria-hidden={!sidebarOpen}
        role="dialog"
        aria-label="Menu do caderno"
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && <div className="app-shell__backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="app-shell__topbar">
        <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      </div>
      <div className="app-shell__main">
        {view === 'notebook' && page && <NotebookPage page={page} onOpenMenu={() => setSidebarOpen(true)} />}
        {view === 'notebook' && !page && <EmptyState onOpenMenu={() => setSidebarOpen(true)} />}
        {view !== 'notebook' && (
          <>
            <ListView />
            {/* Nas listas (Todas / Favoritos) as divisórias ficam coladas na borda da tela. */}
            <div className="app-shell__dividers">
              <SubjectTabs onOpenMenu={() => setSidebarOpen(true)} />
            </div>
          </>
        )}
      </div>

      <RenameDialog />
      <AboutDialog />
    </div>
  );
}
