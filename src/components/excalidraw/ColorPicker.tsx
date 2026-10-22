import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BASE_COLORS,
  HUES,
  Hue,
  TRANSPARENT,
  findHue,
  isValidHex,
  normalizeHex,
} from './colorPalette';
import { EyeDropperIcon } from './panelIcons';

interface Props {
  label: string;
  /** Cor atual; `null` = a seleção tem cores diferentes. */
  value: string | null;
  topPicks: string[];
  allowTransparent?: boolean;
  onChange: (color: string) => void;
}

const POPOVER_W = 236;

function Swatch({
  color,
  active,
  title,
  onClick,
  size = 'md',
}: {
  color: string;
  active: boolean;
  title: string;
  onClick: () => void;
  size?: 'md' | 'lg';
}) {
  const transparent = color === TRANSPARENT;
  return (
    <button
      type="button"
      title={title}
      className={`ecp-swatch ecp-swatch--${size} ${transparent ? 'ecp-swatch--transparent' : ''} ${
        active ? 'is-active' : ''
      } ${color.toLowerCase() === '#ffffff' ? 'ecp-swatch--light' : ''}`}
      style={transparent ? undefined : { background: color }}
      onClick={onClick}
    />
  );
}

/**
 * Seletor de cor no esquema do Excalidraw:
 *  - 5 atalhos rápidos + um botão com a cor atual;
 *  - o botão abre um popover com "Cores" (preto, branco, transparente e um
 *    swatch por matiz), "Tons" (os 5 tons do matiz escolhido) e o código
 *    hexadecimal, com conta-gotas quando o navegador oferece.
 */
export function ColorPicker({ label, value, topPicks, allowTransparent, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [lastHue, setLastHue] = useState<Hue>(HUES[0]);
  const [hexDraft, setHexDraft] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const current = value ?? '';
  const currentHue = value ? findHue(value) : null;
  const activeHue = currentHue ?? lastHue;

  // O rascunho do hex acompanha a cor atual (quando ela é uma cor de verdade).
  useEffect(() => {
    if (value && value !== TRANSPARENT) setHexDraft(value.replace('#', ''));
    else setHexDraft('');
  }, [value]);

  // Posiciona o popover ao lado do painel (fixo na tela, para o overflow do
  // painel não cortá-lo).
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popH = popRef.current?.offsetHeight ?? 320;
    // Mobile: o painel ocupa a largura toda, então não há "ao lado" — o
    // popover abre centralizado na tela.
    if (window.matchMedia('(max-width: 900px)').matches) {
      const w = Math.min(POPOVER_W + 40, window.innerWidth - 16);
      setPos({ left: (window.innerWidth - w) / 2, top: Math.max(8, (window.innerHeight - popH) / 2) });
      return;
    }
    const panel = triggerRef.current.closest('.element-context-panel')?.getBoundingClientRect();
    const anchorLeft = panel ? panel.left : rect.left;
    let left = anchorLeft - POPOVER_W - 10;
    if (left < 8) left = Math.max(8, Math.min(rect.right - POPOVER_W, window.innerWidth - POPOVER_W - 8));
    const top = Math.max(8, Math.min(rect.top - 8, window.innerHeight - popH - 8));
    setPos({ left, top });
  }, [open]);

  // Fecha ao clicar fora ou apertar Esc.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pick(color: string) {
    const hue = findHue(color);
    if (hue) setLastHue(hue);
    onChange(color);
  }

  function onHexInput(raw: string) {
    const digits = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    setHexDraft(digits);
    const hex = `#${digits}`;
    if ((digits.length === 3 || digits.length === 6) && isValidHex(hex)) onChange(normalizeHex(hex));
  }

  async function pickWithEyeDropper() {
    const Ctor = (window as any).EyeDropper;
    if (!Ctor) return;
    try {
      const result = await new Ctor().open();
      if (result?.sRGBHex) pick(normalizeHex(result.sRGBHex));
    } catch {
      /* usuário cancelou */
    }
  }

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const triggerIsTransparent = current === TRANSPARENT;

  return (
    <div className="ecp-section">
      <div className="ecp-label">{label}</div>

      <div className="ecp-row ecp-row--picks">
        {topPicks.map((c) => (
          <Swatch key={c} color={c} title={c === TRANSPARENT ? 'Transparente' : c} active={current.toLowerCase() === c} onClick={() => pick(c)} />
        ))}
        <span className="ecp-divider" />
        <button
          ref={triggerRef}
          type="button"
          title="Mais cores"
          className={`ecp-swatch ecp-swatch--lg ecp-trigger ${triggerIsTransparent || !value ? 'ecp-swatch--transparent' : ''} ${
            open ? 'is-open' : ''
          }`}
          style={!triggerIsTransparent && value ? { background: value } : undefined}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      {open &&
        createPortal(
          <div ref={popRef} className="ecp-popover" style={{
              left: pos.left,
              top: pos.top,
              width: window.matchMedia('(max-width: 900px)').matches
                ? Math.min(POPOVER_W + 40, window.innerWidth - 16)
                : POPOVER_W,
            }}>
            <div className="ecp-popover__title">Cores</div>
            <div className="ecp-grid">
              {allowTransparent && (
                <Swatch color={TRANSPARENT} title="Transparente" active={current === TRANSPARENT} onClick={() => pick(TRANSPARENT)} />
              )}
              {BASE_COLORS.map((c) => (
                <Swatch key={c} color={c} title={c === '#ffffff' ? 'Branco' : 'Preto'} active={current.toLowerCase() === c} onClick={() => pick(c)} />
              ))}
              {HUES.map((h) => (
                <Swatch
                  key={h.key}
                  color={h.shades[4]}
                  title={h.label}
                  active={activeHue.key === h.key && !!currentHue}
                  onClick={() => {
                    setLastHue(h);
                    pick(h.shades[4]);
                  }}
                />
              ))}
            </div>

            <div className="ecp-popover__title">Tons</div>
            <div className="ecp-shades">
              {activeHue.shades.map((c) => (
                <Swatch key={c} color={c} title={c} size="lg" active={current.toLowerCase() === c} onClick={() => pick(c)} />
              ))}
            </div>

            <div className="ecp-popover__title">Código hex</div>
            <div className="ecp-hex">
              <span className="ecp-hex__hash">#</span>
              <input
                type="text"
                className="ecp-hex__input"
                value={hexDraft}
                maxLength={7}
                spellCheck={false}
                placeholder="rrggbb"
                onChange={(e) => onHexInput(e.target.value)}
                onBlur={() => setHexDraft(value && value !== TRANSPARENT ? value.replace('#', '') : '')}
              />
              {hasEyeDropper && (
                <button type="button" title="Conta-gotas" className="ecp-hex__drop" onClick={pickWithEyeDropper}>
                  <EyeDropperIcon />
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
