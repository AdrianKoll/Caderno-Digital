import { useEffect, useId, useRef, useState } from 'react';
import { setPaperStyle } from '../../db/pages';
import { usePaperTone, PaperTone } from '../../hooks/usePaperTone';
import { Page, PaperStyle } from '../../types';
import './SheetAppearanceMenu.css';

const PAPER_STYLES: { value: PaperStyle; label: string; icon: string }[] = [
  { value: 'ruled', label: 'Pautada', icon: 'bi-list-ul' },
  { value: 'grid', label: 'Quadriculada', icon: 'bi-grid-3x3' },
  { value: 'blank', label: 'Branca', icon: 'bi-file-earmark' },
];

const PAPER_TONES: { value: PaperTone; label: string; icon: string }[] = [
  { value: 'light', label: 'Branco', icon: 'bi-sun' },
  { value: 'dark', label: 'Preto', icon: 'bi-moon' },
];

export function SheetAppearanceMenu({ page }: { page: Page }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const { tone, setTone } = usePaperTone();
  const currentStyle = page.paperStyle ?? 'ruled';

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [page.id]);

  return (
    <div className="sheet-appearance" ref={rootRef}>
      <button
        type="button"
        className={`sheet-appearance__trigger ${open ? 'is-open' : ''}`}
        aria-label="Editar folha"
        title="Editar folha"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="bi bi-sliders" aria-hidden="true" />
      </button>

      {open && (
        <div className="sheet-appearance__panel" id={panelId} role="dialog" aria-label="Editar aparência da folha">
          <strong className="sheet-appearance__title">Editar folha</strong>

          <section className="sheet-appearance__group" aria-labelledby={`${panelId}-style-title`}>
            <h3 className="sheet-appearance__group-title" id={`${panelId}-style-title`}>Modelo da página</h3>
            <div className="sheet-appearance__options sheet-appearance__options--models" role="group" aria-label="Modelo da página">
              {PAPER_STYLES.map((style) => {
                const active = currentStyle === style.value;
                return (
                  <button
                    key={style.value}
                    type="button"
                    className={`sheet-appearance__option ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => {
                      if (!active) void setPaperStyle(page.id, style.value);
                    }}
                  >
                    <i className={`bi ${style.icon}`} aria-hidden="true" />
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="sheet-appearance__group" aria-labelledby={`${panelId}-tone-title`}>
            <h3 className="sheet-appearance__group-title" id={`${panelId}-tone-title`}>Fundo da folha</h3>
            <div className="sheet-appearance__options sheet-appearance__options--tones" role="group" aria-label="Fundo da folha">
              {PAPER_TONES.map((option) => {
                const active = tone === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`sheet-appearance__option ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setTone(option.value)}
                  >
                    <i className={`bi ${option.icon}`} aria-hidden="true" />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
