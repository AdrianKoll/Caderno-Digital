<<<<<<< HEAD
import { useRef, useState } from 'react';
=======
import { useState } from 'react';
>>>>>>> origin/main
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import { createSubject } from '../../db/subjects';
<<<<<<< HEAD
import { useNotebookStore } from '../../store/notebookStore';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { downloadBackup, restoreBackupFile } from '../../db/backup';
=======
import { setPaperStyle } from '../../db/pages';
import { useNotebookStore } from '../../store/notebookStore';
import { PaperStyle } from '../../types';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
>>>>>>> origin/main
import './Sidebar.css';

type View = 'notebook' | 'favorites' | 'trash' | 'all';

const NAV_ITEMS: { view: View; label: string; icon: string; iconActive: string }[] = [
  { view: 'notebook', label: 'Início', icon: 'bi-house-door', iconActive: 'bi-house-door-fill' },
  { view: 'all', label: 'Todas as páginas', icon: 'bi-collection', iconActive: 'bi-collection-fill' },
  { view: 'favorites', label: 'Favoritos', icon: 'bi-star', iconActive: 'bi-star-fill' },
  { view: 'trash', label: 'Lixeira', icon: 'bi-trash3', iconActive: 'bi-trash3-fill' },
];

<<<<<<< HEAD
export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);
=======
// Modelos de folha disponíveis (a miniatura usa as mesmas classes .paper--*
// da folha real, ver src/styles/paper.css).
const PAPER_STYLES: { value: PaperStyle; label: string }[] = [
  { value: 'ruled', label: 'Pautada' },
  { value: 'grid', label: 'Quadriculada' },
  { value: 'blank', label: 'Branca' },
];

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
>>>>>>> origin/main
  const { canInstall, install } = useInstallPrompt();
  const view = useNotebookStore((s) => s.view);
  const setView = useNotebookStore((s) => s.setView);
  const openAbout = useNotebookStore((s) => s.openAbout);
<<<<<<< HEAD
  const totalPages = useLiveQuery(() => db.pages.filter((p) => !p.deletedAt).count(), []);
  const favoritePages = useLiveQuery(() => db.pages.filter((p) => p.isFavorite && !p.deletedAt).count(), []);
=======
  const selectedPageId = useNotebookStore((s) => s.selectedPageId);
  const totalPages = useLiveQuery(() => db.pages.count(), []);
  const favoritePages = useLiveQuery(() => db.pages.filter((p) => p.isFavorite).count(), []);
  const currentPage = useLiveQuery(
    () => (selectedPageId ? db.pages.get(selectedPageId) : undefined),
    [selectedPageId],
  );

  const currentPaper: PaperStyle = currentPage?.paperStyle ?? 'ruled';
>>>>>>> origin/main

  async function commitNewSubject() {
    if (newSubjectName.trim()) {
      await createSubject(newSubjectName.trim());
    }
    setAddingSubject(false);
    setNewSubjectName('');
  }

  function go(v: View) {
    setView(v);
    onNavigate();
  }

  function badgeFor(v: View): number | null {
    if (v === 'all') return totalPages ?? 0;
    if (v === 'favorites') return favoritePages ?? 0;
    return null;
  }

<<<<<<< HEAD
  async function exportBackup() {
    setBackupBusy(true);
    try { await downloadBackup(); }
    catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível criar o backup.'); }
    finally { setBackupBusy(false); }
  }

  async function importBackup(file?: File) {
    if (!file) return;
    if (!confirm('Restaurar este backup substituirá todas as matérias, tópicos e páginas deste navegador. Faça um backup atual antes de continuar. Deseja prosseguir?')) {
      if (backupInput.current) backupInput.current.value = '';
      return;
    }
    setBackupBusy(true);
    try {
      const result = await restoreBackupFile(file);
      alert(`Backup restaurado: ${result.subjects} matérias, ${result.topics} tópicos e ${result.pages} páginas.`);
    } catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível restaurar o backup.'); }
    finally {
      setBackupBusy(false);
      if (backupInput.current) backupInput.current.value = '';
    }
  }

  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <button
          type="button"
          className="sidebar__logo-icon"
          onClick={onNavigate}
          aria-label="Fechar menu"
          title="Fechar menu"
        >
          <img className="sidebar__logo-image" src="/icons/brand-256.png" alt="" aria-hidden="true" />
        </button>
        <span className="sidebar__logo-text">
          <strong><span className="sidebar__brand-caderno">Caderno</span> <span className="sidebar__brand-digital">Digital:</span></strong>
          <small>Suas ideias, do seu jeito</small>
        </span>
=======
  return (
    <div className="sidebar">
      <div className="sidebar__logo">
        <span className="sidebar__logo-icon">
          <i className="bi bi-journal-bookmark-fill" />
        </span>
        <span className="sidebar__logo-text">
          <strong>Caderno Digital</strong>
          <small>Suas ideias, do seu jeito</small>
        </span>
        <button className="sidebar__close" onClick={onNavigate} aria-label="Fechar menu" title="Fechar">
          <i className="bi bi-x-lg" />
        </button>
>>>>>>> origin/main
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const active = view === item.view;
          const badge = badgeFor(item.view);
          return (
            <button
              key={item.view}
              className={`sidebar__nav-item ${active ? 'is-active' : ''}`}
              onClick={() => go(item.view)}
            >
              <i className={`bi ${active ? item.iconActive : item.icon}`} />
              <span className="sidebar__nav-label">{item.label}</span>
              {badge !== null && <span className="sidebar__nav-badge">{badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__section">
        <div className="sidebar__section-header">
          <span className="sidebar__section-title">
            <i className="bi bi-journals" />
            MATÉRIAS
          </span>
          <button title="Nova matéria" aria-label="Nova matéria" onClick={() => setAddingSubject(true)}>
            <i className="bi bi-plus-lg" />
          </button>
        </div>
        {addingSubject && (
          <div className="sidebar__new-subject">
            <input
              autoFocus
              placeholder="Nome da matéria"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              onBlur={commitNewSubject}
              onKeyDown={(e) => e.key === 'Enter' && commitNewSubject()}
            />
          </div>
        )}
        <HierarchyTree />
      </div>

<<<<<<< HEAD
=======
      <div className="sidebar__papers">
        <div className="sidebar__papers-title">
          <i className="bi bi-file-earmark-ruled" />
          Modelos de página
        </div>
        <div className="sidebar__papers-grid">
          {PAPER_STYLES.map((p) => {
            const active = !!currentPage && currentPaper === p.value;
            return (
              <button
                key={p.value}
                type="button"
                className={`paper-thumb ${active ? 'is-active' : ''}`}
                disabled={!currentPage}
                title={currentPage ? `Usar folha ${p.label.toLowerCase()}` : 'Abra uma página para trocar o modelo'}
                aria-pressed={active}
                onClick={() => currentPage && setPaperStyle(currentPage.id, p.value)}
              >
                <span className={`paper-thumb__preview paper paper--${p.value}`} />
                <span className="paper-thumb__label">{p.label}</span>
              </button>
            );
          })}
        </div>
        {!currentPage && <p className="sidebar__papers-hint">Abra uma página para escolher o modelo.</p>}
      </div>

>>>>>>> origin/main
      {canInstall && (
        <button type="button" className="sidebar__install" onClick={install}>
          <i className="bi bi-phone" />
          <span>
            Instalar app
            <small>Abre em tela cheia e funciona offline</small>
          </span>
        </button>
      )}

<<<<<<< HEAD
      <section className="sidebar__backup" aria-label="Backup do caderno">
        <strong>Backup local</strong>
        <button type="button" disabled={backupBusy} onClick={exportBackup}>
          <i className="bi bi-download" /> Salvar backup
        </button>
        <button type="button" disabled={backupBusy} onClick={() => backupInput.current?.click()}>
          <i className="bi bi-upload" /> Restaurar backup
        </button>
        <input ref={backupInput} type="file" accept="application/json,.json" hidden onChange={(e) => void importBackup(e.target.files?.[0])} />
        <small>O arquivo contém seus dados locais. Guarde-o em local seguro.</small>
      </section>

      <div className="sidebar__footer">
        <div className="sidebar__footer-label">Total de páginas</div>
        <div className="sidebar__footer-count">{totalPages ?? 0}</div>
      </div>

=======
>>>>>>> origin/main
      <button
        type="button"
        className="sidebar__about"
        onClick={() => {
          onNavigate();
          openAbout();
        }}
      >
        <i className="bi bi-info-circle" />
        <span>Sobre e créditos</span>
      </button>
<<<<<<< HEAD
=======

      <div className="sidebar__footer">
        <div className="sidebar__footer-label">Total de páginas</div>
        <div className="sidebar__footer-count">{totalPages ?? 0}</div>
      </div>
>>>>>>> origin/main
    </div>
  );
}
