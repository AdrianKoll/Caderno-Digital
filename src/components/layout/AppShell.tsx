import { useEffect, useRef, useState } from 'react';
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
  const sidebarRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const view = useNotebookStore((s) => s.view);
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const focusMode = useNotebookStore((s) => s.focusMode);
  const setFocusMode = useNotebookStore((s) => s.setFocusMode);

  // Gaveta: arrastar da borda abre, arrastar para o lado fecha; Esc também fecha.
  useDrawerGestures(sidebarOpen, setSidebarOpen, isMobile);
  useEffect(() => {
    if (!sidebarOpen) {
      sidebarRef.current?.setAttribute('inert', '');
      [topbarRef.current, mainRef.current].forEach((el) => {
        el?.removeAttribute('inert');
        el?.removeAttribute('aria-hidden');
      });
      if (wasOpenRef.current) openerRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    sidebarRef.current?.removeAttribute('inert');
    wasOpenRef.current = true;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstControl = sidebarRef.current?.querySelector<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    );
    (firstControl ?? sidebarRef.current)?.focus();
    [topbarRef.current, mainRef.current].forEach((el) => {
      el?.setAttribute('inert', '');
      el?.setAttribute('aria-hidden', 'true');
    });
    const focusable = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ) ?? []).filter((el) => el.getClientRects().length > 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setSidebarOpen(false); return; }
      if (e.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { e.preventDefault(); sidebarRef.current?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !sidebarRef.current?.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !sidebarRef.current?.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sidebarOpen]);

  const page = useLiveQuery(
    () => (selectedPageId ? db.pages.get(selectedPageId) : undefined),
    [selectedPageId],
  );

  // Modo escrita: só vale no celular, dentro de uma página aberta. Sair da folha (listas, etc.) o desliga.
  const focus = focusMode && isMobile && view === 'notebook' && !!page;
  useEffect(() => {
    if (focusMode && view !== 'notebook') setFocusMode(false);
  }, [focusMode, view, setFocusMode]);

  return (
    <div className={`app-shell ${focus ? 'is-focus' : ''}`}>
      <div
        ref={sidebarRef}
        className={`app-shell__sidebar ${sidebarOpen ? 'is-open' : ''}`}
        id="caderno-sidebar"
        aria-hidden={!sidebarOpen}
        aria-modal={sidebarOpen || undefined}
        role="dialog"
        aria-label="Menu do caderno"
      >
          <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>
      {sidebarOpen && <div className="app-shell__backdrop" onClick={() => setSidebarOpen(false)} />}
      <div className="app-shell__topbar" ref={topbarRef}>
        <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((v) => !v)} />
      </div>
      <div className="app-shell__main" ref={mainRef}>
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

      {focus && (
        <button
          type="button"
          className="app-shell__focus-exit"
          onClick={() => setFocusMode(false)}
          aria-label="Sair do modo escrita"
          title="Sair do modo escrita"
        >
          <i className="bi bi-fullscreen-exit" />
        </button>
      )}

      <RenameDialog />
      <AboutDialog />
    </div>
  );
}
