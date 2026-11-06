import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { renamePage } from '../../db/pages';
import { renameSubject, subjectNameTaken } from '../../db/subjects';
import { renameTopic, topicNameTaken } from '../../db/topics';
import { RenameTarget, useNotebookStore } from '../../store/notebookStore';
import { NAME_MAX, TITLE_MAX, normalizeName } from '../../utils/names';
import './RenameDialog.css';

interface Entity {
  name: string;
  /** Matéria do tópico (para checar nome repetido). */
  subjectId?: string;
  /** Linha de contexto abaixo do título (ex.: "Matéria: Python"). */
  context: string;
}

const COPY = {
  subject: { title: 'Renomear matéria', label: 'Nome da matéria', placeholder: 'Ex.: Matemática', max: NAME_MAX },
  topic: { title: 'Renomear tópico', label: 'Nome do tópico', placeholder: 'Ex.: Funções', max: NAME_MAX },
  page: { title: 'Renomear página', label: 'Título da página', placeholder: 'Sem título', max: TITLE_MAX },
} as const;

async function loadEntity(target: RenameTarget): Promise<Entity | null> {
  if (target.kind === 'subject') {
    const s = await db.subjects.get(target.id);
    return s ? { name: s.name, context: 'Todas as páginas dessa matéria continuam onde estão.' } : null;
  }
  if (target.kind === 'topic') {
    const t = await db.topics.get(target.id);
    if (!t) return null;
    const s = await db.subjects.get(t.subjectId);
    return { name: t.name, subjectId: t.subjectId, context: s ? `Matéria: ${s.name}` : '' };
  }
  const p = await db.pages.get(target.id);
  return p ? { name: p.title, context: `Página ${p.number}` } : null;
}

/**
 * Janela única de "Renomear" para matéria, tópico e página. Qualquer lugar do
 * app abre com `openRename({ kind, id })` (ver notebookStore). Enter salva,
 * Esc cancela; nomes repetidos de matéria/tópico são avisados.
 */
export function RenameDialog() {
  const target = useNotebookStore((s) => s.renameTarget);
  const entity = useLiveQuery(
    () => (target ? loadEntity(target) : Promise.resolve(undefined)),
    [target?.kind, target?.id],
  );
  if (!target || !entity) return null;
  // `key`: ao trocar de alvo o formulário recomeça do zero, com o nome atual.
  return createPortal(<RenameForm key={`${target.kind}:${target.id}`} target={target} entity={entity} />, document.body);
}

function RenameForm({ target, entity }: { target: RenameTarget; entity: Entity }) {
  const close = useNotebookStore((s) => s.closeRename);
  const copy = COPY[target.kind];
  const [value, setValue] = useState(entity.name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Foco no campo (com o texto selecionado) e volta o foco para onde estava ao fechar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    inputRef.current?.select();
    return () => previous?.focus?.();
  }, []);

  async function validate(name: string): Promise<string | null> {
    if (target.kind === 'subject') {
      if (!name) return 'Escreva um nome para a matéria.';
      if (await subjectNameTaken(name, target.id)) return 'Já existe uma matéria com esse nome.';
    }
    if (target.kind === 'topic') {
      if (!name) return 'Escreva um nome para o tópico.';
      if (entity.subjectId && (await topicNameTaken(entity.subjectId, name, target.id))) {
        return 'Já existe um tópico com esse nome nesta matéria.';
      }
    }
    return null; // página: título vazio é permitido
  }

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (saving) return;
    const name = normalizeName(value).slice(0, copy.max);
    if (name === normalizeName(entity.name)) return close(); // nada mudou
    setSaving(true);
<<<<<<< HEAD
    setError(null);
    try {
      const problem = await validate(name);
      if (problem) {
        setError(problem);
        inputRef.current?.focus();
        return;
      }
      if (target.kind === 'subject') await renameSubject(target.id, name);
      else if (target.kind === 'topic') await renameTopic(target.id, name);
      else await renamePage(target.id, name);
      close();
    } catch (cause) {
      console.error('Falha ao renomear item local:', cause);
      setError('Não foi possível salvar a alteração. Verifique o armazenamento disponível e tente novamente.');
      inputRef.current?.focus();
    } finally {
      setSaving(false);
    }
=======
    const problem = await validate(name);
    if (problem) {
      setError(problem);
      setSaving(false);
      inputRef.current?.focus();
      return;
    }
    if (target.kind === 'subject') await renameSubject(target.id, name);
    else if (target.kind === 'topic') await renameTopic(target.id, name);
    else await renamePage(target.id, name);
    close();
>>>>>>> origin/main
  }

  // Esc fecha; Tab fica preso dentro da janela.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>('input, button:not(:disabled)');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  const titleId = `rename-title-${target.id}`;
  return (
    <div className="rename-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()} onKeyDown={onKeyDown}>
      <div ref={cardRef} className="rename-card" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <form onSubmit={submit} noValidate>
          <h2 id={titleId} className="rename-card__title">
            {copy.title}
          </h2>
          {entity.context && <p className="rename-card__context">{entity.context}</p>}

          <label className="rename-card__label" htmlFor={`${titleId}-input`}>
            {copy.label}
          </label>
          <input
            id={`${titleId}-input`}
            ref={inputRef}
            className={`rename-card__input ${error ? 'has-error' : ''}`}
            value={value}
            maxLength={copy.max}
            placeholder={copy.placeholder}
            autoComplete="off"
            enterKeyHint="done"
            aria-invalid={!!error}
            aria-describedby={error ? `${titleId}-error` : undefined}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
          />
          <div className="rename-card__meta">
            {error ? (
              <span id={`${titleId}-error`} className="rename-card__error" role="alert">
                {error}
              </span>
            ) : target.kind === 'page' ? (
              <span className="rename-card__hint">Deixe vazio para mostrar só “Página”.</span>
            ) : (
              <span />
            )}
            <span className="rename-card__count">
              {value.length}/{copy.max}
            </span>
          </div>

          <div className="rename-card__actions">
<<<<<<< HEAD
            <button type="button" className="rename-card__btn" onClick={close} disabled={saving}>
=======
            <button type="button" className="rename-card__btn" onClick={close}>
>>>>>>> origin/main
              Cancelar
            </button>
            <button type="submit" className="rename-card__btn rename-card__btn--primary" disabled={saving}>
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
