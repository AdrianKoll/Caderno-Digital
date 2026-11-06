import { Page } from '../../types';
import { useNotebookStore } from '../../store/notebookStore';
import './PageHeader.css';

interface Props {
  page: Page;
  subjectName: string;
  topicName: string;
  onChangeDate: (date: string) => void;
}

/**
 * Cabeçalho da folha: Matéria · Tópico · Data. O TÍTULO da página não fica
 * aqui (para não ocupar a área de escrita): ele aparece ao lado da aba do
 * tópico, em cima da folha (ver binder/PageTitle.tsx).
 */
export function PageHeader({ page, subjectName, topicName, onChangeDate }: Props) {
  const openRename = useNotebookStore((s) => s.openRename);

  return (
    <div className="page-header">
      <Field
        className="page-header__field--subject"
        label="Matéria:"
        value={subjectName || '—'}
        onRename={() => openRename({ kind: 'subject', id: page.subjectId })}
        renameLabel="Renomear matéria"
      />
      <Field
        className="page-header__field--topic"
        label="Tópico:"
        value={topicName || '—'}
        onRename={() => openRename({ kind: 'topic', id: page.topicId })}
        renameLabel="Renomear tópico"
      />
      <Field className="page-header__field--date" label="Data:" value={page.date} editable onChange={onChangeDate} />
    </div>
  );
}

function Field({
  className,
  label,
  value,
  editable,
  onChange,
  onRename,
  renameLabel,
}: {
  className: string;
  label: string;
  value: string;
  editable?: boolean;
  onChange?: (v: string) => void;
  /** Quando existe, aparece um lápis ao lado do rótulo para renomear o item (matéria/tópico). */
  onRename?: () => void;
  renameLabel?: string;
}) {
  return (
    <div className={`page-header__field ${className}`}>
      <div className="page-header__label" title={label}>
        <span>{label}</span>
        {onRename && (
          <button type="button" className="page-header__edit" title={renameLabel} aria-label={renameLabel} onClick={onRename}>
            <i className="bi bi-pencil" />
          </button>
        )}
      </div>
      {editable ? (
        <input
          className="page-header__value page-header__value--input"
          value={value}
          aria-label={label.replace(':', '')}
          title={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        // `title`: o texto longo é cortado com "…" — passar o mouse (ou segurar o dedo) mostra inteiro.
        <div className="page-header__value" title={value}>
          {value}
        </div>
      )}
    </div>
  );
}
