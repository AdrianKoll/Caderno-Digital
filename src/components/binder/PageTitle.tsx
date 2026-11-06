import { useEffect, useRef, useState } from 'react';
import { Page } from '../../types';
import { renamePage } from '../../db/pages';
import { TITLE_MAX, normalizeName } from '../../utils/names';
import './PageTitle.css';

/**
 * Título da página, ao lado das abas de tópico, em cima da folha — fora da
 * área de escrita. É um campo: clica e escreve; Enter ou sair do campo salva,
 * Esc desfaz.
 */
export function PageTitle({ page }: { page: Page }) {
  const [value, setValue] = useState(page.title);
  const focused = useRef(false);
<<<<<<< HEAD
  const cancelOnBlur = useRef(false);
=======
>>>>>>> origin/main

  // Acompanha mudanças de fora (renomeou pelo menu/janela, trocou de página) enquanto não se está digitando.
  useEffect(() => {
    if (!focused.current) setValue(page.title);
  }, [page.id, page.title]);

  async function commit() {
<<<<<<< HEAD
    if (cancelOnBlur.current) {
      cancelOnBlur.current = false;
      focused.current = false;
      setValue(page.title);
      return;
    }
=======
>>>>>>> origin/main
    focused.current = false;
    const clean = normalizeName(value).slice(0, TITLE_MAX);
    setValue(clean);
    if (clean !== page.title) await renamePage(page.id, clean);
  }

  return (
    <label className="page-title" data-empty={value.trim() === ''} title="Título da página">
      <i className="bi bi-file-earmark-text page-title__icon" aria-hidden="true" />
      <input
        className="page-title__input"
        value={value}
        maxLength={TITLE_MAX}
        placeholder="Título da página"
        aria-label="Título da página"
        enterKeyHint="done"
        spellCheck
        onFocus={() => (focused.current = true)}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          const input = e.target as HTMLInputElement;
          if (e.key === 'Enter') input.blur();
          if (e.key === 'Escape') {
<<<<<<< HEAD
            e.preventDefault();
            cancelOnBlur.current = true;
=======
>>>>>>> origin/main
            setValue(page.title);
            focused.current = false;
            input.blur();
          }
        }}
      />
    </label>
  );
}
