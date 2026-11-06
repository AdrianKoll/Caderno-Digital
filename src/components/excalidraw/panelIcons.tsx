import { ReactNode } from 'react';

/**
 * Ícones do painel de propriedades. São desenhos simples em traço
 * (viewBox 24x24, `currentColor`), no espírito dos ícones do Excalidraw:
 * herdam a cor do botão, então o estado ativo funciona sem nada extra.
 */
function Svg({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// --- Espessura / estilo do traço / irregularidade -------------------------

export function StrokeWidthIcon({ width }: { width: number }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth={width * 1.5} strokeLinecap="round" />
    </svg>
  );
}

export function StrokeStyleIcon({ style }: { style: string }) {
  const dash = style === 'dashed' ? '4 3.5' : style === 'dotted' ? '0.1 4.2' : undefined;
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}

export function RoughnessIcon({ level }: { level: number }) {
  const d =
    level === 0
      ? 'M3 14 L21 10'
      : level === 1
        ? 'M3 14 C8 9 9 16 13 12 S19 10 21 10'
        : 'M3 15 C5 8 8 17 11 10 S14 16 16 9 S19 13 21 8';
  return (
    <Svg>
      <path d={d} />
    </Svg>
  );
}

// --- Preenchimento ---------------------------------------------------------

export function FillIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <defs>
        <clipPath id={`fill-clip-${kind}`}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </clipPath>
      </defs>
      {kind === 'solid' && <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" />}
      {kind === 'hachure' && (
        <g clipPath={`url(#fill-clip-${kind})`} stroke="currentColor" strokeWidth="1.4">
          <path d="M0 22 L22 0 M0 17 L17 0 M0 12 L12 0 M0 7 L7 0 M5 24 L24 5 M10 24 L24 10 M15 24 L24 15" />
        </g>
      )}
      {kind === 'cross-hatch' && (
        <g clipPath={`url(#fill-clip-${kind})`} stroke="currentColor" strokeWidth="1.2">
          <path d="M0 22 L22 0 M0 17 L17 0 M0 12 L12 0 M0 7 L7 0 M5 24 L24 5 M10 24 L24 10 M15 24 L24 15" />
          <path d="M2 0 L24 22 M7 0 L24 17 M12 0 L24 12 M17 0 L24 7 M0 5 L19 24 M0 10 L14 24 M0 15 L9 24" />
        </g>
      )}
      {kind === 'zigzag' && (
        <g clipPath={`url(#fill-clip-${kind})`} stroke="currentColor" strokeWidth="1.3">
          <path d="M4 7 L8 10 L4 13 M8 10 L12 7 L16 10 L20 7 M4 13 L8 16 L12 13 L16 16 L20 13 M4 19 L8 16 M12 19 L16 16 L20 19" />
        </g>
      )}
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" />
    </svg>
  );
}

// --- Bordas / tipo de seta / pontas ---------------------------------------

export function EdgesIcon({ kind }: { kind: 'sharp' | 'round' }) {
  return (
    <Svg>
      <path d={kind === 'sharp' ? 'M5 20 V5 H20' : 'M5 20 V13 Q5 5 13 5 H20'} />
    </Svg>
  );
}

export function ArrowTypeIcon({ kind }: { kind: 'sharp' | 'round' }) {
  return (
    <Svg>
      <path d={kind === 'sharp' ? 'M4 19 L12 6 L20 15' : 'M4 19 Q8 4 20 13'} />
      <path d={kind === 'sharp' ? 'M15.5 15.5 L20 15 L18.4 10.6' : 'M15.4 15.6 L20 13 L16.4 9.4'} />
    </Svg>
  );
}

/** Pontas de seta: a linha vai sempre da esquerda para a direita; `flip` espelha (ponta inicial). */
export function ArrowheadIcon({ kind, flip }: { kind: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <g transform={flip ? 'translate(24 0) scale(-1 1)' : undefined}>
        <line x1="3" y1="12" x2={kind === 'none' ? 21 : kind === 'dot' ? 15 : kind === 'triangle' || kind === 'diamond' ? 14 : 20} y2="12" />
        {kind === 'arrow' && <path d="M14 6.5 L20 12 L14 17.5" />}
        {kind === 'bar' && <line x1="20" y1="6.5" x2="20" y2="17.5" />}
        {kind === 'dot' && <circle cx="18" cy="12" r="3" fill="currentColor" />}
        {kind === 'triangle' && <path d="M14 7 L21 12 L14 17 Z" fill="currentColor" />}
        {kind === 'diamond' && <path d="M14 12 L17.5 7.5 L21 12 L17.5 16.5 Z" fill="currentColor" />}
      </g>
    </svg>
  );
}

// --- Texto -----------------------------------------------------------------

export function TextAlignIcon({ align }: { align: 'left' | 'center' | 'right' }) {
  const rows = [
    { w: 16, y: 6 },
    { w: 10, y: 10.5 },
    { w: 16, y: 15 },
    { w: 8, y: 19.5 },
  ];
  return (
    <Svg>
      {rows.map((r) => {
        const x1 = align === 'left' ? 4 : align === 'center' ? 12 - r.w / 2 : 20 - r.w;
        return <line key={r.y} x1={x1} y1={r.y} x2={x1 + r.w} y2={r.y} />;
      })}
    </Svg>
  );
}

export function VerticalAlignIcon({ align }: { align: 'top' | 'middle' | 'bottom' }) {
  // Duas bordas (a ativa é mais forte) e um bloco cheio que sobe/desce entre elas.
  const y = align === 'top' ? 6 : align === 'middle' ? 9 : 12;
  return (
    <Svg>
      <line x1="4" y1="3.5" x2="20" y2="3.5" opacity={align === 'top' ? 1 : 0.35} />
      <line x1="4" y1="20.5" x2="20" y2="20.5" opacity={align === 'bottom' ? 1 : 0.35} />
      <rect x="7" y={y} width="10" height="6" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// --- Camadas / alinhar / ações --------------------------------------------

export function LayerIcon({ kind }: { kind: 'toBack' | 'backward' | 'forward' | 'toFront' }) {
  const up = kind === 'forward' || kind === 'toFront';
  const strong = kind === 'toBack' || kind === 'toFront';
  return (
    <Svg>
      <path d={up ? 'M12 19 V6 M7 11 L12 6 L17 11' : 'M12 5 V18 M7 13 L12 18 L17 13'} />
      {strong && <line x1="6" y1={up ? 3.5 : 20.5} x2="18" y2={up ? 3.5 : 20.5} />}
    </Svg>
  );
}

/**
 * Alinhar objetos: uma linha de referência na borda e duas barras CHEIAS
 * (como os ícones do Excalidraw). As barras são sólidas de propósito — com
 * retângulos só de contorno, o conjunto lembrava ideogramas.
 */
export function AlignIcon({ mode }: { mode: 'left' | 'centerH' | 'right' | 'top' | 'centerV' | 'bottom' }) {
  const bar = (x: number, y: number, w: number, h: number) => (
    <rect x={x} y={y} width={w} height={h} rx="1" fill="currentColor" stroke="none" />
  );
  switch (mode) {
    case 'left':
      return (
        <Svg>
          <line x1="4" y1="3" x2="4" y2="21" />
          {bar(7, 5, 13, 5)}
          {bar(7, 14, 8, 5)}
        </Svg>
      );
    case 'centerH':
      return (
        <Svg>
          <line x1="12" y1="3" x2="12" y2="21" />
          {bar(5, 5, 14, 5)}
          {bar(8, 14, 8, 5)}
        </Svg>
      );
    case 'right':
      return (
        <Svg>
          <line x1="20" y1="3" x2="20" y2="21" />
          {bar(4, 5, 13, 5)}
          {bar(9, 14, 8, 5)}
        </Svg>
      );
    case 'top':
      return (
        <Svg>
          <line x1="3" y1="4" x2="21" y2="4" />
          {bar(5, 7, 5, 13)}
          {bar(14, 7, 5, 8)}
        </Svg>
      );
    case 'centerV':
      return (
        <Svg>
          <line x1="3" y1="12" x2="21" y2="12" />
          {bar(5, 4, 5, 14)}
          {bar(14, 8, 5, 8)}
        </Svg>
      );
    case 'bottom':
      return (
        <Svg>
          <line x1="3" y1="20" x2="21" y2="20" />
          {bar(5, 4, 5, 13)}
          {bar(14, 9, 5, 8)}
        </Svg>
      );
  }
}

export function DistributeIcon({ axis }: { axis: 'horizontal' | 'vertical' }) {
  return axis === 'horizontal' ? (
    <Svg>
      <line x1="4" y1="3" x2="4" y2="21" />
      <line x1="20" y1="3" x2="20" y2="21" />
      <rect x="9.5" y="7" width="5" height="10" rx="1" />
    </Svg>
  ) : (
    <Svg>
      <line x1="3" y1="4" x2="21" y2="4" />
      <line x1="3" y1="20" x2="21" y2="20" />
      <rect x="7" y="9.5" width="10" height="5" rx="1" />
    </Svg>
  );
}

export function DuplicateIcon() {
  return (
    <Svg>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8 V6 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 v8 a2 2 0 0 0 2 2 H8" />
    </Svg>
  );
}

export function TrashIcon() {
  return (
    <Svg>
      <path d="M4 7 H20 M10 11 V17 M14 11 V17 M6 7 L7 19 a2 2 0 0 0 2 2 H15 a2 2 0 0 0 2 -2 L18 7 M9 7 V4 H15 V7" />
    </Svg>
  );
}

export function GroupIcon() {
  return (
    <Svg>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" strokeDasharray="2.5 2.5" />
      <rect x="7" y="7" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </Svg>
  );
}

export function UngroupIcon() {
  return (
    <Svg>
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <rect x="12" y="12" width="8" height="8" rx="1" />
      <path d="M15 4 h3 a2 2 0 0 1 2 2 v3 M9 20 H6 a2 2 0 0 1 -2 -2 v-3" strokeDasharray="2.5 2.5" />
    </Svg>
  );
}

export function LinkIcon() {
  return (
    <Svg>
      <path d="M10 14 a4 4 0 0 0 5.7 0 l3.3 -3.3 a4 4 0 0 0 -5.7 -5.7 L12 6.3" />
      <path d="M14 10 a4 4 0 0 0 -5.7 0 L5 13.3 a4 4 0 0 0 5.7 5.7 L12 17.7" />
    </Svg>
  );
}

export function LockIcon() {
  return (
    <Svg>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11 V8 a4 4 0 0 1 8 0 v3" />
    </Svg>
  );
}

export function EyeDropperIcon() {
  return (
    <Svg>
      <path d="M14 6 l4 4 M15.5 4.5 a2.1 2.1 0 0 1 3 3 L16 10 l-4 -4 z M12 8 L5 15 v4 h4 l7 -7" />
    </Svg>
  );
}

export function MoreFontsIcon() {
  return (
    <Svg>
      <path d="M6 10 l6 6 l6 -6" />
    </Svg>
  );
}
