import { KeyboardEvent, useEffect, useRef, useState } from 'react';

interface Props {
  initial: string;
  placeholder?: string;
  maxLength: number;
  /** Título de página pode ficar vazio; nome de matéria/tópico não. */
  allowEmpty?: boolean;
  /** Devolve a mensagem de erro, ou `null` se estiver tudo certo. */
  validate?: (value: string) => Promise<string | null> | string | null;
  onCommit: (value: string) => Promise<void> | void;
  onCancel: () => void;
  className?: string;
}

/**
 * Campo de renomear dentro da árvore do menu. Enter salva (e, se houver erro,
 * mostra a mensagem e continua editando), Esc cancela, sair do campo salva
 * quando está válido e descarta quando não está.
 */
export function InlineName({ initial, placeholder, maxLength, allowEmpty, validate, onCommit, onCancel, className }: Props) {
  const [value, setValue] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const done = useRef(false); // evita salvar duas vezes (Enter + blur)

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function commit(fromBlur: boolean) {
    if (done.current) return;
    const name = value.replace(/\s+/g, ' ').trim();
    if (name === initial.trim() || (!name && !allowEmpty && fromBlur)) {
      done.current = true;
      return onCancel();
    }
    if (!name && !allowEmpty) {
      setError('Escreva um nome.');
      return;
    }
    const problem = validate ? await validate(name) : null;
    if (problem) {
      if (fromBlur) {
        done.current = true;
        return onCancel();
      }
      setError(problem);
      return;
    }
    done.current = true;
    await onCommit(name);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    e.stopPropagation(); // espaço/setas não devem abrir/fechar a linha da árvore
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      done.current = true;
      onCancel();
    }
  }

  return (
    <span className="inline-name" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        className={`tree-row__input ${error ? 'has-error' : ''} ${className ?? ''}`}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-label={placeholder ?? 'Novo nome'}
        enterKeyHint="done"
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        onBlur={() => commit(true)}
        onKeyDown={onKeyDown}
      />
      {error && (
        <span className="inline-name__error" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
