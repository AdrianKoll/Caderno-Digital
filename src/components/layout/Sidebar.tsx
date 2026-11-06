import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { HierarchyTree } from '../hierarchy/HierarchyTree';
import { createSubject } from '../../db/subjects';
import { useNotebookStore } from '../../store/notebookStore';
import { useInstallPrompt } from '../../pwa/useInstallPrompt';
import { downloadBackup, restoreBackupFile } from '../../db/backup';
import './Sidebar.css';

type View = 'notebook' | 'favorites' | 'trash' | 'all';

const NAV_ITEMS: { view: View; label: string; icon: string; iconActive: string }[] = [
  { view: 'notebook', label: 'Início', icon: 'bi-house-door', iconActive: 'bi-house-door-fill' },
  { view: 'all', label: 'Todas as páginas', icon: 'bi-collection', iconActive: 'bi-collection-fill' },
  { view: 'favorites', label: 'Favoritos', icon: 'bi-star', iconActive: 'bi-star-fill' },
  { view: 'trash', label: 'Lixeira', icon: 'bi-trash3', iconActive: 'bi-trash3-fill' },
];

export function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const [addingSubject, setAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const backupInput = useRef<HTMLInputElement>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const { canInstall, install } = useInstallPrompt();
  const view = useNotebookStore((s) => s.view);
  const setView = useNotebookStore((s) => s.setView);
  const openAbout = useNotebookStore((s) => s.openAbout);
  const totalPages = useLiveQuery(() => db.pages.filter((p) => !p.deletedAt).count(), []);
  const favoritePages = useLiveQuery(() => db.pages.filter((p) => p.isFavorite && !p.deletedAt).count(), []);

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

      {canInstall && (
        <button type="button" className="sidebar__install" onClick={install}>
          <i className="bi bi-phone" />
          <span>
            Instalar app
            <small>Abre em tela cheia e funciona offline</small>
          </span>
        </button>
      )}

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
    </div>
  );
}
