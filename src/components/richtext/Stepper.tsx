import { useEffect, useRef, useState } from 'react';
import './Stepper.css';

interface Props {
  value: number | null;
  min: number;
  max: number;
  step: number;
  decimals?: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  /** Mantém o foco onde está (o editor de texto não pode perder a seleção). */
  keepFocus?: boolean;
  className?: string;
}

/**
 * Contador numérico: [ − ]  21  [ + ]. Toque/clique nos botões muda de 1 em 1;
 * segurar repete rápido; também dá para digitar o valor exato.
 */
export function Stepper({ value, min, max, step, decimals = 0, onChange, ariaLabel, keepFocus, className }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const holding = useRef(false);
  const current = useRef<number>(value ?? min);
  const timers = useRef<{ start?: number; repeat?: number }>({});

  if (!holding.current) current.current = value ?? min;

  const round = (n: number) => Number(Math.min(max, Math.max(min, n)).toFixed(decimals));

  function nudge(dir: 1 | -1) {
    const next = round(current.current + dir * step);
    if (next !== current.current) {
      current.current = next;
      onChange(next);
    }
  }

  function stop() {
    holding.current = false;
    window.clearTimeout(timers.current.start);
    window.clearInterval(timers.current.repeat);
  }

  useEffect(() => stop, []);

  function press(dir: 1 | -1) {
    holding.current = true;
    nudge(dir);
    timers.current.start = window.setTimeout(() => {
      timers.current.repeat = window.setInterval(() => nudge(dir), 70);
    }, 400);
  }

  function commitDraft() {
    if (draft === null) return;
    const parsed = parseFloat(draft.replace(',', '.'));
    setDraft(null);
    if (Number.isFinite(parsed)) {
      const next = round(parsed);
      current.current = next;
      onChange(next);
    }
  }

  const keep = keepFocus ? { onMouseDown: (e: { preventDefault: () => void }) => e.preventDefault() } : {};
  const shown = draft ?? (value === null ? '—' : value.toFixed(decimals));

  return (
    <div className={`stepper ${className ?? ''}`} role="group" aria-label={ariaLabel}>
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Diminuir ${ariaLabel}`}
        onPointerDown={(e) => {
          e.preventDefault();
          press(-1);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        {...keep}
      >
        −
      </button>
      <input
        className="stepper__input"
        inputMode="decimal"
        value={shown}
        aria-label={ariaLabel}
        onFocus={(e) => {
          setDraft(value === null ? '' : value.toFixed(decimals));
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitDraft();
            (e.currentTarget as HTMLInputElement).blur();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nudge(1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(-1);
          }
          e.stopPropagation();
        }}
      />
      <button
        type="button"
        className="stepper__btn"
        aria-label={`Aumentar ${ariaLabel}`}
        onPointerDown={(e) => {
          e.preventDefault();
          press(1);
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        {...keep}
      >
        +
      </button>
    </div>
  );
}
